from supabase import Client, create_client

from app.core.config import settings


supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key,
)


def upload_audio(
    file_bytes: bytes,
    storage_path: str,
    content_type: str,
) -> None:
    supabase.storage.from_(
        settings.supabase_bucket_name
    ).upload(
        storage_path,
        file_bytes,
        {
            "content-type": content_type,
            "upsert": "false",
        },
    )