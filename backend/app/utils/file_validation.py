import os
from dataclasses import dataclass
from pathlib import PurePosixPath

from fastapi import UploadFile


SUPPORTED_AUDIO_MIME_TYPES: dict[str, frozenset[str]] = {
    ".wav": frozenset({"audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"}),
    ".mp3": frozenset({"audio/mpeg", "audio/mp3"}),
    ".ogg": frozenset({"audio/ogg", "application/ogg"}),
    ".flac": frozenset({"audio/flac", "audio/x-flac"}),
    ".aac": frozenset({"audio/aac", "audio/x-aac"}),
    ".m4a": frozenset({"audio/mp4", "audio/x-m4a", "audio/m4a"}),
}
GENERIC_MIME_TYPES = frozenset({"", "application/octet-stream", "binary/octet-stream"})


class FileValidationError(Exception):
    def __init__(self, detail: str, status_code: int = 415) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


@dataclass(frozen=True)
class ValidatedAudio:
    filename: str
    size_bytes: int
    content_type: str | None
    extension: str


def sanitize_filename(filename: str | None) -> str:
    if filename is None or not filename.strip():
        raise FileValidationError("A filename is required.", 422)

    # Treat both slash styles as separators and retain only a display basename.
    basename = PurePosixPath(filename.replace("\\", "/")).name
    safe_name = "".join(char for char in basename if char.isprintable() and char not in {"\x00", "/", "\\"}).strip()
    if safe_name in {"", ".", ".."}:
        raise FileValidationError("The filename is invalid.", 422)
    if len(safe_name) > 255:
        raise FileValidationError("The filename is too long.", 422)
    return safe_name


def _has_expected_signature(extension: str, header: bytes) -> bool:
    if extension == ".wav":
        return len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WAVE"
    if extension == ".mp3":
        return header.startswith(b"ID3") or (len(header) >= 2 and header[0] == 0xFF and header[1] & 0xE0 == 0xE0)
    if extension == ".ogg":
        return header.startswith(b"OggS")
    if extension == ".flac":
        return header.startswith(b"fLaC")
    if extension == ".aac":
        return len(header) >= 2 and header[0] == 0xFF and header[1] & 0xF6 == 0xF0
    if extension == ".m4a":
        return len(header) >= 8 and header[4:8] == b"ftyp"
    return False


def validate_audio_upload(upload: UploadFile, max_size_bytes: int) -> ValidatedAudio:
    filename = sanitize_filename(upload.filename)
    extension = PurePosixPath(filename).suffix.lower()
    allowed_mime_types = SUPPORTED_AUDIO_MIME_TYPES.get(extension)
    if allowed_mime_types is None:
        supported = ", ".join(ext.removeprefix(".").upper() for ext in SUPPORTED_AUDIO_MIME_TYPES)
        raise FileValidationError(f"Unsupported audio format. Supported formats: {supported}.", 415)

    content_type = (upload.content_type or "").split(";", maxsplit=1)[0].strip().lower()
    if content_type not in GENERIC_MIME_TYPES and content_type not in allowed_mime_types:
        raise FileValidationError("The uploaded MIME type does not match a supported audio format.", 415)

    upload.file.seek(0, os.SEEK_END)
    size_bytes = upload.file.tell()
    upload.file.seek(0)
    if size_bytes == 0:
        raise FileValidationError("The uploaded audio file is empty.", 422)
    if size_bytes > max_size_bytes:
        max_mb = max_size_bytes // (1024 * 1024)
        raise FileValidationError(f"Audio file is too large. Maximum allowed size is {max_mb} MB.", 413)

    header = upload.file.read(32)
    upload.file.seek(0)
    if not _has_expected_signature(extension, header):
        raise FileValidationError("The file contents do not match a supported audio format.", 415)

    return ValidatedAudio(
        filename=filename,
        size_bytes=size_bytes,
        content_type=content_type or None,
        extension=extension,
    )
