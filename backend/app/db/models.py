from enum import Enum
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4
from sqlalchemy import Integer
from sqlalchemy import DateTime, Float, Index, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
class JobStatus(str, Enum):
    QUEUED = "queued"
    UPLOADING = "uploading"
    PROCESSING = "processing"
    TRANSCRIBING = "transcribing"
    SUMMARIZING = "summarizing"
    COMPLETED = "completed"
    FAILED = "failed"

class Transcription(Base):
    __tablename__ = "transcriptions"
    __table_args__ = (
        Index("ix_transcriptions_status", "status"),
        Index("ix_transcriptions_created_at", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="processing")
    transcription: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    language_code: Mapped[str] = mapped_column(String(8), nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    provider_request_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    provider_timestamp: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    processing_time_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now, server_default=func.now())
class Job(Base):
    __tablename__ = "jobs"

    __table_args__ = (
        Index("ix_jobs_status", "status"),
        Index("ix_jobs_created_at", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    storage_path: Mapped[Optional[str]] = mapped_column(
        String(1024),
        nullable=True,
    )

    file_size_bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    mime_type: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        default=JobStatus.QUEUED.value,
    )

    progress: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    current_stage: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=JobStatus.QUEUED.value,
    )

    transcript: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    language: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )

    duration: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
        server_default=func.now(),
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )