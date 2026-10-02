import logging
from dataclasses import dataclass
from typing import BinaryIO

import httpx

from app.core.config import Settings, settings
from app.schemas.transcription import TranscriptFormat

logger = logging.getLogger(__name__)

# This is the public REST endpoint documented by Gnani's Speech-to-Text (REST) page.
GNANI_STT_ENDPOINT = "https://api.vachana.ai/stt/v3"
GNANI_API_KEY_HEADER = "X-API-Key-ID"


class ASRServiceError(Exception):
    def __init__(self, public_detail: str, status_code: int, error_code: str) -> None:
        super().__init__(public_detail)
        self.public_detail = public_detail
        self.status_code = status_code
        self.error_code = error_code


@dataclass(frozen=True)
class ASRResult:
    transcript: str
    request_id: str | None = None
    timestamp: str | None = None


class ASRService:
    def __init__(
        self,
        config: Settings = settings,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.config = config
        self.transport = transport

    def transcribe(
        self,
        *,
        audio_file: BinaryIO,
        filename: str,
        content_type: str | None,
        language_code: str,
        transcript_format: TranscriptFormat,
        itn_native_numerals: bool,
    ) -> ASRResult:
        api_key = self.config.gnani_api_key
        if api_key is None or not api_key.get_secret_value().strip():
            raise ASRServiceError(
                "The transcription provider is not configured.",
                status_code=503,
                error_code="provider_not_configured",
            )

        form_fields = {
            "language_code": language_code,
            "format": transcript_format.value,
        }
        if itn_native_numerals:
            form_fields["itn_native_numerals"] = "true"

        timeout_seconds = self.config.gnani_timeout_seconds
        timeout = httpx.Timeout(timeout_seconds, connect=min(timeout_seconds, 10.0))
        headers = {GNANI_API_KEY_HEADER: api_key.get_secret_value()}
        files = {"audio_file": (filename, audio_file, content_type or "application/octet-stream")}

        logger.info("Gnani transcription request started language_code=%s format=%s", language_code, transcript_format.value)
        try:
            # httpx creates the multipart boundary; setting Content-Type manually would break it.
            with httpx.Client(timeout=timeout, transport=self.transport) as client:
                response = client.post(
                    GNANI_STT_ENDPOINT,
                    headers=headers,
                    data=form_fields,
                    files=files,
                )
        except httpx.TimeoutException as exc:
            logger.warning("Gnani request timed out")
            raise ASRServiceError(
                "The transcription provider timed out. Please try again.",
                status_code=504,
                error_code="provider_timeout",
            ) from exc
        except httpx.RequestError as exc:
            logger.warning("Gnani connection failed error_type=%s", type(exc).__name__)
            raise ASRServiceError(
                "Unable to connect to the transcription provider.",
                status_code=502,
                error_code="provider_connection_error",
            ) from exc

        if response.status_code != 200:
            self._raise_provider_http_error(response)

        try:
            payload = response.json()
        except ValueError as exc:
            logger.warning("Gnani returned a non-JSON success response")
            raise ASRServiceError(
                "The transcription provider returned an invalid response.",
                status_code=502,
                error_code="malformed_provider_response",
            ) from exc

        if not isinstance(payload, dict):
            raise ASRServiceError(
                "The transcription provider returned an invalid response.",
                status_code=502,
                error_code="malformed_provider_response",
            )

        if payload.get("success") is not True:
            provider_error = payload.get("error")
            provider_error_type = provider_error.get("type") if isinstance(provider_error, dict) else None
            logger.warning("Gnani reported an unsuccessful result error_type=%s", provider_error_type or "unknown")
            raise ASRServiceError(
                "The transcription provider could not process this audio.",
                status_code=502,
                error_code="provider_unsuccessful_response",
            )

        transcript = payload.get("transcript")
        if not isinstance(transcript, str):
            logger.warning("Gnani success response did not include a transcript string")
            raise ASRServiceError(
                "The transcription provider returned an incomplete response.",
                status_code=502,
                error_code="malformed_provider_response",
            )

        request_id = payload.get("request_id")
        timestamp = payload.get("timestamp")
        result = ASRResult(
            transcript=transcript,
            request_id=request_id if isinstance(request_id, str) else None,
            timestamp=timestamp if isinstance(timestamp, str) else None,
        )
        logger.info("Gnani transcription request completed request_id=%s", result.request_id or "unavailable")
        return result

    @staticmethod
    def _raise_provider_http_error(response: httpx.Response) -> None:
        status_code = response.status_code
        logger.warning("Gnani returned HTTP status=%s", status_code)
        if status_code == 400:
            raise ASRServiceError(
                "Gnani rejected the audio or parameters. Check the supported format, language, and 60-second duration limit.",
                status_code=422,
                error_code="provider_invalid_request",
            )
        if status_code == 403:
            raise ASRServiceError(
                "The transcription provider denied access. Check the API key, account status, and available credits.",
                status_code=502,
                error_code="provider_authentication_error",
            )
        if status_code == 429:
            raise ASRServiceError(
                "The transcription provider is rate limiting requests. Please try again later.",
                status_code=429,
                error_code="provider_rate_limited",
            )
        if status_code in {500, 503}:
            raise ASRServiceError(
                "The transcription service is temporarily unavailable. Please try again later.",
                status_code=503,
                error_code="provider_unavailable",
            )
        raise ASRServiceError(
            "The transcription provider could not process the request.",
            status_code=502,
            error_code="provider_http_error",
        )
