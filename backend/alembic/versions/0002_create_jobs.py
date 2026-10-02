"""Create the jobs table.

Revision ID: 0002_create_jobs
Revises: 0001_create_transcriptions
Create Date: 2026-10-02
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_create_jobs"
down_revision: Union[str, None] = "0001_create_transcriptions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "jobs",

        sa.Column(
            "id",
            sa.Uuid(as_uuid=True),
            nullable=False,
        ),

        sa.Column(
            "filename",
            sa.String(length=255),
            nullable=False,
        ),

        sa.Column(
            "storage_path",
            sa.String(length=1024),
            nullable=True,
        ),

        sa.Column(
            "file_size_bytes",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "mime_type",
            sa.String(length=100),
            nullable=True,
        ),

        sa.Column(
            "status",
            sa.String(length=24),
            nullable=False,
        ),

        sa.Column(
            "progress",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),

        sa.Column(
            "current_stage",
            sa.String(length=50),
            nullable=False,
            server_default="queued",
        ),

        sa.Column(
            "transcript",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "summary",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "language",
            sa.String(length=20),
            nullable=True,
        ),

        sa.Column(
            "duration",
            sa.Float(),
            nullable=True,
        ),

        sa.Column(
            "error_message",
            sa.Text(),
            nullable=True,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),

        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_jobs_status",
        "jobs",
        ["status"],
        unique=False,
    )

    op.create_index(
        "ix_jobs_created_at",
        "jobs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_jobs_created_at",
        table_name="jobs",
    )

    op.drop_index(
        "ix_jobs_status",
        table_name="jobs",
    )

    op.drop_table("jobs")