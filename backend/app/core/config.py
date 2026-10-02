from functools import cached_property
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


# backend/
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    database_url: str = Field(min_length=1)

    gnani_api_key: SecretStr | None = None

    allowed_origins: str = "http://localhost:3000"

    max_upload_size_mb: int = Field(default=100, ge=1)

    gnani_timeout_seconds: float = Field(default=75.0, gt=0)
    
    supabase_url: str
    supabase_service_role_key: str
    supabase_bucket_name: str = "audio-files"
    
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @cached_property
    def allowed_origins_list(self) -> list[str]:
        return [
            origin.strip().rstrip("/")
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        ]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


settings = Settings()