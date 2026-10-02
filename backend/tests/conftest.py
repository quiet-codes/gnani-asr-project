import os

# Set the isolated test database before app modules instantiate SQLAlchemy settings.
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["MAX_UPLOAD_SIZE_MB"] = "1"
os.environ["GNANI_TIMEOUT_SECONDS"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.api.dependencies import get_asr_service
from app.db.database import Base, SessionLocal, engine
from app.db.models import Transcription
from app.main import app


@pytest.fixture(autouse=True)
def prepare_database():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        db.execute(delete(Transcription))
        db.commit()
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def override_asr():
    def apply(service):
        app.dependency_overrides[get_asr_service] = lambda: service
    return apply
