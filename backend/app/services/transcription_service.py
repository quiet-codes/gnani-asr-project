import logging
from time import perf_counter
from typing import BinaryIO

from sqlalchemy.orm import Session

from app.db.models import Transcription
from app.schemas.transcription import TranscriptFormat
from app.services.asr_service import ASRResult, ASRService, ASRServiceError

logger = logging.getLogger(__name__)


class TranscriptionService:
    def __init__(self, db: Session, asr_service: ASRService) -> None:
        self.db = db
        self.asr_service = asr_service

    def create(
        self,
        *,
        filename: str,
        audio_file: BinaryIO,
        content_type: str | None,
        language_code: str,
        transcript_format: TranscriptFormat,
        itn_native_numerals: bool,
    ) -> Transcription:
        record = Transcription(
            filename=filename,
            status="processing",
            language_code=language_code,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        logger.info("Transcription record created id=%s", record.id)

        started_at = perf_counter()
        try:
            result = self.asr_service.transcribe(
                audio_file=audio_file,
                filename=filename,
                content_type=content_type,
                language_code=language_code,
                transcript_format=transcript_format,
                itn_native_numerals=itn_native_numerals,
            )
        except ASRServiceError as exc:
            self._mark_failed(record, exc.public_detail, perf_counter() - started_at)
            logger.warning("Transcription failed id=%s category=%s", record.id, exc.error_code)
            raise
        except Exception:
            self._mark_failed(record, "Unable to process the audio file.", perf_counter() - started_at)
            logger.exception("Unexpected transcription service failure id=%s", record.id)
            raise

        self._mark_completed(record, result, perf_counter() - started_at)
        logger.info("Transcription record completed id=%s", record.id)
        return record

    def _mark_failed(self, record: Transcription, public_message: str, elapsed_seconds: float) -> None:
        record.status = "failed"
        record.error_message = public_message
        record.processing_time_seconds = round(elapsed_seconds, 3)
        self.db.commit()
        self.db.refresh(record)

    def _mark_completed(self, record: Transcription, result: ASRResult, elapsed_seconds: float) -> None:
        record.status = "completed"
        record.transcription = result.transcript
        record.provider_request_id = result.request_id
        record.provider_timestamp = result.timestamp
        record.error_message = None
        record.processing_time_seconds = round(elapsed_seconds, 3)
        self.db.commit()
        self.db.refresh(record)

