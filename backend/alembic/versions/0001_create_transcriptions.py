"""Create the transcriptions table.

Revision ID: 0001_create_transcriptions
Revises:
Create Date: 2026-10-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_create_transcriptions"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "transcriptions",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("transcription", sa.Text(), nullable=True),
        sa.Column("language_code", sa.String(length=8), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("provider_request_id", sa.String(length=128), nullable=True),
        sa.Column("provider_timestamp", sa.String(length=32), nullable=True),
        sa.Column("processing_time_seconds", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transcriptions_status", "transcriptions", ["status"], unique=False)
    op.create_index("ix_transcriptions_created_at", "transcriptions", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_transcriptions_created_at", table_name="transcriptions")
    op.drop_index("ix_transcriptions_status", table_name="transcriptions")
    op.drop_table("transcriptions")
