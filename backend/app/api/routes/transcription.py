import logging
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_asr_service
from app.core.config import settings
from app.db.database import get_db
from app.db.models import Transcription
from app.schemas.transcription import (
    LanguageCode,
    TranscriptFormat,
    TranscriptionListItem,
    TranscriptionListResponse,
    TranscriptionResponse,
)
from app.services.asr_service import ASRService, ASRServiceError
from app.services.transcription_service import TranscriptionService
from app.utils.file_validation import FileValidationError, validate_audio_upload

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/transcriptions",
    response_model=TranscriptionResponse,
    status_code=201,
    tags=["transcriptions"],
    summary="Create a transcription",
)
def create_transcription(
    file: UploadFile = File(..., description="Audio file; WAV, MP3, OGG, FLAC, AAC, or M4A."),
    language_code: LanguageCode = Form(..., description="Required BCP-47 language code supported by Gnani."),
    transcript_format: TranscriptFormat = Form(default=TranscriptFormat.VERBATIM, alias="format"),
    itn_native_numerals: bool = Form(default=False),
    db: Session = Depends(get_db),
    asr_service: ASRService = Depends(get_asr_service),
) -> Transcription:
    if file is None:
        raise HTTPException(status_code=422, detail="An audio file is required in the 'file' form field.")

    try:
        validated_audio = validate_audio_upload(file, settings.max_upload_size_bytes)
    except FileValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    logger.info(
        "Transcription request received size_bytes=%s language_code=%s",
        validated_audio.size_bytes,
        language_code.value,
    )
    file.file.seek(0)
    service = TranscriptionService(db, asr_service)
    try:
        return service.create(
            filename=validated_audio.filename,
            audio_file=file.file,
            content_type=validated_audio.content_type,
            language_code=language_code.value,
            transcript_format=transcript_format,
            itn_native_numerals=itn_native_numerals,
        )
    except ASRServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.public_detail) from exc
    except SQLAlchemyError:
        # The global database handler logs details and returns a safe public message.
        raise


@router.get(
    "/transcriptions/{transcription_id}",
    response_model=TranscriptionResponse,
    tags=["transcriptions"],
    summary="Retrieve a transcription",
)
def get_transcription(
    transcription_id: UUID,
    db: Session = Depends(get_db),
) -> Transcription:
    record = db.get(Transcription, transcription_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Transcription not found.")
    return record


@router.get(
    "/transcriptions",
    response_model=TranscriptionListResponse,
    tags=["transcriptions"],
    summary="List recent transcriptions",
)
def list_transcriptions(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> TranscriptionListResponse:
    statement = (
        select(Transcription)
        .order_by(desc(Transcription.created_at), desc(Transcription.id))
        .limit(limit)
        .offset(offset)
    )
    records = db.scalars(statement).all()
    items = [TranscriptionListItem.model_validate(record) for record in records]
    return TranscriptionListResponse(items=items, limit=limit, offset=offset)
