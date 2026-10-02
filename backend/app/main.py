import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes import health, transcription
from app.core.config import settings
from app.core.logging_config import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Gnani AI Transcription API",
    description="A small FastAPI service that validates audio, calls Gnani Speech-to-Text, and stores transcription records.",
    version="1.0.0",
)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Gnani AI Transcription API",
        "version": "1.0.0",
    }
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

app.include_router(health.router, prefix="/api")
app.include_router(transcription.router, prefix="/api")


@app.middleware("http")
async def limit_transcription_request_size(request: Request, call_next):
    if request.method == "POST" and request.url.path == "/api/transcriptions":
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                body_size = int(content_length)
            except ValueError:
                body_size = 0
            # Allow a small multipart envelope in addition to the configured file limit.
            if body_size > settings.max_upload_size_bytes + 1024 * 1024:
                return JSONResponse(status_code=413, content={"detail": "Audio upload is too large."})
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def request_validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.info("Request validation failed path=%s", request.url.path)
    missing_file = any(
        error.get("loc", ()) and error.get("loc", ())[-1] == "file"
        for error in exc.errors()
    )
    detail = (
        "An audio file is required in the 'file' form field."
        if missing_file
        else "Invalid request. Check required form fields and supported values."
    )
    return JSONResponse(status_code=422, content={"detail": detail})


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("Database operation failed path=%s", request.url.path)
    return JSONResponse(status_code=503, content={"detail": "Database temporarily unavailable."})


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled request failure path=%s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Unable to process the request."})
