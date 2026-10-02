from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import JobStatus


class JobCreateResponse(BaseModel):
    job_id: UUID
    status: JobStatus


class JobStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: UUID
    status: JobStatus
    progress: int = Field(ge=0, le=100)
    current_stage: str
    error_message: Optional[str] = None


class JobMetadata(BaseModel):
    duration: Optional[float] = None
    language: Optional[str] = None
    file_name: str
    file_size_bytes: int
    mime_type: Optional[str] = None


class JobResultResponse(BaseModel):
    job_id: UUID
    status: JobStatus
    transcript: Optional[str] = None
    summary: Optional[str] = None
    metadata: JobMetadata
    error_message: Optional[str] = None


class JobHistoryItem(BaseModel):
    job_id: UUID
    filename: str
    status: JobStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[float] = None
    summary_preview: Optional[str] = None