from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.database import SessionLocal
from app.db.models import Transcription
from app.services.asr_service import ASRResult, ASRServiceError


def make_wav(size: int = 32) -> bytes:
    payload = b"\x00" * max(0, size - 12)
    total_size = 12 + len(payload)
    return b"RIFF" + (total_size - 8).to_bytes(4, "little") + b"WAVE" + payload


class SuccessfulASR:
    def __init__(self) -> None:
        self.call_values: dict[str, object] = {}

    def transcribe(self, **kwargs) -> ASRResult:
        self.call_values = kwargs
        return ASRResult(
            transcript="नमस्ते, आप कैसे हैं?",
            request_id="req_abc123",
            timestamp="20251226_143052.123",
        )


class FailedASR:
    def transcribe(self, **kwargs) -> ASRResult:
        raise ASRServiceError(
            "The transcription service is temporarily unavailable. Please try again later.",
            status_code=503,
            error_code="provider_unavailable",
        )


def test_health_checks_database(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_missing_audio_file_returns_clear_validation_error(client: TestClient) -> None:
    response = client.post("/api/transcriptions", data={"language_code": "hi-IN"})
    assert response.status_code == 422
    assert response.json()["detail"] == "An audio file is required in the 'file' form field."


def test_unsupported_file_is_rejected_before_asr(client: TestClient) -> None:
    response = client.post(
        "/api/transcriptions",
        data={"language_code": "hi-IN"},
        files={"file": ("notes.txt", b"plain text", "text/plain")},
    )
    assert response.status_code == 415
    assert "Unsupported audio format" in response.json()["detail"]


def test_oversized_audio_is_rejected(client: TestClient) -> None:
    large_wav = make_wav(1024 * 1024 + 1)
    response = client.post(
        "/api/transcriptions",
        data={"language_code": "hi-IN"},
        files={"file": ("large.wav", large_wav, "audio/wav")},
    )
    assert response.status_code == 413
    assert "Maximum allowed size is 1 MB" in response.json()["detail"]


def test_successful_transcription_flow_uses_mocked_asr_and_persists_record(
    client: TestClient,
    override_asr,
) -> None:
    mocked_asr = SuccessfulASR()
    override_asr(mocked_asr)

    response = client.post(
        "/api/transcriptions",
        data={"language_code": "hi-IN", "format": "transcribe"},
        files={"file": ("../../meeting.wav", make_wav(), "audio/wav")},
    )

    assert response.status_code == 201
    body = response.json()
    transcription_id = UUID(body["id"])
    assert body["filename"] == "meeting.wav"
    assert body["status"] == "completed"
    assert body["transcription"] == "नमस्ते, आप कैसे हैं?"
    assert body["language_code"] == "hi-IN"
    assert body["provider_request_id"] == "req_abc123"
    assert body["provider_timestamp"] == "20251226_143052.123"
    assert body["created_at"]
    assert body["processing_time_seconds"] >= 0
    assert mocked_asr.call_values["language_code"] == "hi-IN"

    get_response = client.get(f"/api/transcriptions/{transcription_id}")
    assert get_response.status_code == 200
    assert get_response.json()["transcription"] == "नमस्ते, आप कैसे हैं?"

    history_response = client.get("/api/transcriptions?limit=10&offset=0")
    assert history_response.status_code == 200
    assert len(history_response.json()["items"]) == 1
    # The history response avoids returning the full transcript body.
    assert "transcription" not in history_response.json()["items"][0]


def test_provider_failure_is_recorded_and_returned_safely(
    client: TestClient,
    override_asr,
) -> None:
    override_asr(FailedASR())
    response = client.post(
        "/api/transcriptions",
        data={"language_code": "en-IN"},
        files={"file": ("call.wav", make_wav(), "audio/wav")},
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "The transcription service is temporarily unavailable. Please try again later."}
    with SessionLocal() as db:
        record = db.scalar(select(Transcription))
        assert record is not None
        assert record.status == "failed"
        assert record.transcription is None
        assert record.error_message == response.json()["detail"]


def test_database_failure_returns_safe_error(client: TestClient) -> None:
    from sqlalchemy.exc import SQLAlchemyError
    from app.db.database import get_db

    def broken_db():
        raise SQLAlchemyError("database-password-must-not-be-returned")

    client.app.dependency_overrides[get_db] = broken_db
    response = client.get("/api/health")
    assert response.status_code == 503
    assert response.json() == {"detail": "Database temporarily unavailable."}
    assert "password" not in response.text


def test_missing_record_returns_404(client: TestClient) -> None:
    response = client.get("/api/transcriptions/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    assert response.json() == {"detail": "Transcription not found."}
