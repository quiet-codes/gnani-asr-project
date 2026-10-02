from io import BytesIO

import httpx
import pytest
from pydantic import SecretStr

from app.core.config import Settings
from app.schemas.transcription import TranscriptFormat
from app.services.asr_service import ASRService, ASRServiceError, GNANI_STT_ENDPOINT


def make_settings(api_key: str | None = "test-key") -> Settings:
    return Settings(
        database_url="sqlite+pysqlite:///:memory:",
        gnani_api_key=SecretStr(api_key) if api_key is not None else None,
        gnani_timeout_seconds=2,
    )


def test_gnani_request_matches_documented_rest_contract() -> None:
    observed: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        observed["url"] = str(request.url)
        observed["method"] = request.method
        observed["api_key"] = request.headers.get("X-API-Key-ID")
        observed["content_type"] = request.headers.get("Content-Type")
        observed["body"] = request.read()
        return httpx.Response(
            200,
            json={
                "success": True,
                "request_id": "req_abc123",
                "timestamp": "20251226_143052.123",
                "transcript": "नमस्ते",
            },
        )

    service = ASRService(make_settings(), transport=httpx.MockTransport(handler))
    result = service.transcribe(
        audio_file=BytesIO(b"RIFF\x00\x00\x00\x00WAVE"),
        filename="hello.wav",
        content_type="audio/wav",
        language_code="hi-IN",
        transcript_format=TranscriptFormat.VERBATIM,
        itn_native_numerals=False,
    )

    assert observed["url"] == GNANI_STT_ENDPOINT
    assert observed["method"] == "POST"
    assert observed["api_key"] == "test-key"
    assert str(observed["content_type"]).startswith("multipart/form-data; boundary=")
    body = bytes(observed["body"]).decode("latin-1")
    assert 'name="audio_file"; filename="hello.wav"' in body
    assert 'name="language_code"' in body and "hi-IN" in body
    assert 'name="format"' in body and "verbatim" in body
    assert result.transcript == "नमस्ते"
    assert result.request_id == "req_abc123"
    assert result.timestamp == "20251226_143052.123"


def test_gnani_403_is_mapped_without_returning_provider_response_body() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"success": False, "error": {"type": "FORBIDDEN", "message": "sensitive provider detail"}})

    service = ASRService(make_settings(), transport=httpx.MockTransport(handler))
    with pytest.raises(ASRServiceError) as error:
        service.transcribe(
            audio_file=BytesIO(b"audio"),
            filename="hello.wav",
            content_type="audio/wav",
            language_code="en-IN",
            transcript_format=TranscriptFormat.VERBATIM,
            itn_native_numerals=False,
        )

    assert error.value.status_code == 502
    assert "sensitive provider detail" not in error.value.public_detail


def test_missing_gnani_key_fails_before_network_request() -> None:
    service = ASRService(make_settings(api_key=None), transport=httpx.MockTransport(lambda request: pytest.fail("network must not be called")))
    with pytest.raises(ASRServiceError) as error:
        service.transcribe(
            audio_file=BytesIO(b"audio"),
            filename="hello.wav",
            content_type="audio/wav",
            language_code="en-IN",
            transcript_format=TranscriptFormat.VERBATIM,
            itn_native_numerals=False,
        )
    assert error.value.status_code == 503
    assert error.value.error_code == "provider_not_configured"
