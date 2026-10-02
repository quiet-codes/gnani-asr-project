from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LanguageCode(str, Enum):
    BENGALI = "bn-IN"
    ENGLISH = "en-IN"
    GUJARATI = "gu-IN"
    HINDI = "hi-IN"
    KANNADA = "kn-IN"
    MALAYALAM = "ml-IN"
    MARATHI = "mr-IN"
    PUNJABI = "pa-IN"
    TAMIL = "ta-IN"
    TELUGU = "te-IN"


class TranscriptFormat(str, Enum):
    VERBATIM = "verbatim"
    TRANSCRIBE = "transcribe"


class TranscriptionStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TranscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    status: TranscriptionStatus
    transcription: Optional[str] = None
    language_code: LanguageCode
    error_message: Optional[str] = None
    provider_request_id: Optional[str] = None
    provider_timestamp: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class TranscriptionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    status: TranscriptionStatus
    language_code: LanguageCode
    processing_time_seconds: Optional[float] = None
    created_at: datetime


class TranscriptionListResponse(BaseModel):
    items: list[TranscriptionListItem]
    limit: int = Field(ge=1, le=100)
    offset: int = Field(ge=0)


class HealthResponse(BaseModel):
    status: str
    database: str
