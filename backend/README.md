# Gnani AI Transcription Backend

A small production-minded FastAPI service that validates an uploaded audio file, calls Gnani's documented Speech-to-Text REST API, and stores the returned transcript and provider metadata in PostgreSQL. It does **not** store the audio file, call an LLM, or implement background workers.

## Gnani API contract used

The integration below follows the official [Gnani Speech-to-Text (REST) documentation](https://docs.gnani.ai/api/STT/speech-to-text) as its source of truth:

- Endpoint: `POST https://api.vachana.ai/stt/v3`
- Authentication header: `X-API-Key-ID: <GNANI_API_KEY>`
- Multipart file field: `audio_file`
- Required form field: `language_code`
- Supported languages: `bn-IN`, `en-IN`, `gu-IN`, `hi-IN`, `kn-IN`, `ml-IN`, `mr-IN`, `pa-IN`, `ta-IN`, `te-IN`
- Supported audio formats: WAV, MP3, OGG, FLAC, AAC, M4A
- Maximum audio duration: 60 seconds; the documentation says 30 seconds or less is ideal
- Optional output controls implemented here: `format` (`verbatim` by default or `transcribe`) and `itn_native_numerals`
- A successful response includes `success`, `transcript`, and may include `request_id` and `timestamp`.

The REST endpoint is **synchronous**. There is no job polling contract in this documentation. This backend returns after Gnani responds; it does not claim to be an asynchronous transcription queue. The application-level byte limit is configurable (100 MB by default), but it is separate from Gnani's 60-second duration limit. Gnani may reject a longer recording with HTTP 400. The API key and all provider request details stay server-side.

## Requirements

- Python 3.10+
- PostgreSQL 13+ (or a compatible PostgreSQL service)
- A Gnani Prisma v2.5 API key from the Gnani/Vachana dashboard

## Local setup

Commands below assume you are in the `backend/` directory.

### 1. Create PostgreSQL database

For a local PostgreSQL installation, create a database and user (or use an existing local role):

```sql
CREATE USER gnani_app WITH PASSWORD 'change-this-password';
CREATE DATABASE gnani_asr OWNER gnani_app;
```

The SQL can be run from `psql` or a PostgreSQL GUI. Do not use the sample password outside local development.

### 2. Create and activate a virtual environment

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
```

On Windows, copy the file in Explorer or use `Copy-Item .env.example .env` in PowerShell. Update `DATABASE_URL` and `GNANI_API_KEY` in `.env`:

```dotenv
DATABASE_URL=postgresql+psycopg://gnani_app:change-this-password@localhost:5432/gnani_asr
GNANI_API_KEY=your-real-gnani-api-key
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
MAX_UPLOAD_SIZE_MB=100
GNANI_TIMEOUT_SECONDS=75
```

The password must be URL-encoded if it contains reserved URL characters. The public Gnani endpoint is the documented constant in `app/services/asr_service.py`; no undocumented provider URL or authentication scheme is assumed.

### 5. Run database migrations

```bash
alembic upgrade head
```

Alembic creates the `transcriptions` table and indexes. There is no need to run manual table-creation SQL.

### 6. Start FastAPI

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health check: `http://127.0.0.1:8000/api/health`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

## API endpoints

### `GET /api/health`

Runs `SELECT 1` against PostgreSQL and reports both service and database health.

```json
{ "status": "ok", "database": "connected" }
```

A database problem returns HTTP 503 with a safe `detail` message.

### `POST /api/transcriptions`

Accepts `multipart/form-data` and completes the Gnani REST call during the request.

| Field | Required | Value |
| --- | --- | --- |
| `file` | Yes | Audio file; WAV, MP3, OGG, FLAC, AAC, or M4A |
| `language_code` | Yes | One of the ten documented BCP-47 codes listed above |
| `format` | No | `verbatim` (documented default) or `transcribe` |
| `itn_native_numerals` | No | `false` by default; used with `format=transcribe` |

Example using `curl` against the FastAPI backend:

```bash
curl -X POST http://127.0.0.1:8000/api/transcriptions \
  -F 'file=@sample.wav;type=audio/wav' \
  -F 'language_code=hi-IN' \
  -F 'format=transcribe' \
  -F 'itn_native_numerals=false'
```

Successful HTTP 201 response:

```json
{
  "id": "a9be2b56-3050-46fa-84e3-09cbbcae142d",
  "filename": "sample.wav",
  "status": "completed",
  "transcription": "नमस्ते, आप कैसे हैं?",
  "language_code": "hi-IN",
  "error_message": null,
  "provider_request_id": "req_abc123",
  "provider_timestamp": "20251226_143052.123",
  "processing_time_seconds": 1.284,
  "created_at": "2026-10-02T10:30:00Z",
  "updated_at": "2026-10-02T10:30:01Z"
}
```

`provider_request_id` and `provider_timestamp` are nullable because the documented response may omit them. Duration is not returned by this REST API and therefore is not fabricated or stored.

### `GET /api/transcriptions/{transcription_id}`

Returns a saved record by UUID, including status, transcript (if completed), language, timestamps, provider identifiers, and processing time. A missing record returns 404.

### `GET /api/transcriptions?limit=20&offset=0`

Optional history endpoint. It returns recent records without transcript bodies. `limit` is 1–100; `offset` is zero or greater.

## Request and response flow

1. FastAPI parses the `file` upload and required `language_code` form value.
2. `app/utils/file_validation.py` sanitizes the display filename, checks extension/MIME, checks a small file signature, verifies non-empty contents, and enforces `MAX_UPLOAD_SIZE_MB`.
3. `TranscriptionService` creates and commits a `processing` record with a UUID.
4. `ASRService` posts the uploaded file to `https://api.vachana.ai/stt/v3` as `audio_file`, with `language_code`, `format`, and `X-API-Key-ID`. HTTPX generates the multipart boundary. Audio is passed through from FastAPI's spooled upload file and is not persisted.
5. On a valid `success: true` response, the service stores `transcript`, `request_id`, `timestamp`, processing time, and `completed` status. On provider failure it saves a safe failure message and `failed` status, then returns an appropriate HTTP error.
6. The route returns the persisted Pydantic response. `GET` endpoints read from PostgreSQL.

## PostgreSQL schema

`transcriptions` contains:

- `id`: UUID primary key
- `filename`: sanitized basename only; never used as a filesystem path
- `status`: `processing`, `completed`, or `failed`
- `transcription`: returned transcript text (nullable until completed)
- `language_code`: requested supported code
- `error_message`: safe public failure summary, not raw provider response
- `provider_request_id`, `provider_timestamp`: Gnani response metadata when supplied
- `processing_time_seconds`: elapsed provider operation time
- `created_at`, `updated_at`: timezone-aware timestamps

The audio bytes are not stored in PostgreSQL or a permanent filesystem location. FastAPI's upload spool is closed when the request finishes.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLAlchemy URL, e.g. `postgresql+psycopg://user:password@host:5432/dbname` |
| `GNANI_API_KEY` | For transcription | Sent only in `X-API-Key-ID`; never logged or returned |
| `ALLOWED_ORIGINS` | Recommended | Comma-separated exact browser origins; local origins are the development default |
| `MAX_UPLOAD_SIZE_MB` | No | Maximum audio file size in MiB; default `100` |
| `GNANI_TIMEOUT_SECONDS` | No | External request timeout; default `75` seconds |

`GNANI_API_URL` is intentionally not configurable in this implementation: the integration uses the single public endpoint specified in the supplied Gnani documentation. The request timeout is configurable, but requests are **not retried automatically** because the supplied REST documentation does not define an idempotency key and a retry could repeat a billable transcription.

## CORS and frontend integration

`ALLOWED_ORIGINS` is parsed into exact origins; the application does not allow `*`. For local Next.js, the example allows `http://localhost:3000` and `http://127.0.0.1:3000`. For Vercel, replace/add the exact production origin, for example:

```dotenv
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://your-app.vercel.app
```

Do not add a trailing slash. Add a Vercel preview origin only if that specific preview should be allowed; avoid a wildcard regex for all preview deployments.

The frontend request must be `FormData` with the field name `file` and required `language_code`, for example:

```ts
const body = new FormData();
body.append("file", audioFile);
body.append("language_code", "hi-IN");
body.append("format", "verbatim");

const response = await fetch(`${API_BASE_URL}/api/transcriptions`, {
  method: "POST",
  body
});
```

Do not set the multipart `Content-Type` header manually; the browser must add the boundary. Keep `GNANI_API_KEY` on the backend only.

**Integration note:** The frontend currently in the workspace uses the earlier mock/job contract (`/api/v1/jobs`, then status polling) and does not collect the Gnani-required `language_code`. This backend deliberately implements the requested synchronous `POST /api/transcriptions` contract and does not modify the frontend. To connect them, the frontend API layer must switch to this endpoint, send a supported language code, and handle the completed response directly. The REST endpoint documented by Gnani is for clips up to 60 seconds; longer audio requires the separate Batch STT API and is outside this implementation.

## Errors and reliability

All application errors use a JSON `detail` string and do not expose stack traces, API keys, or raw provider bodies. Main mappings:

- Missing/invalid form values: 422
- Unsupported extension/MIME/signature: 415
- Empty file: 422
- File/body too large: 413
- Missing transcription: 404
- Gnani 400 invalid request/audio: 422
- Gnani 403 access/auth failure: 502
- Gnani 429 rate limit: 429
- Gnani 500/503: 503
- Gnani timeout: 504
- Database unavailable: 503
- Unexpected server failure: 500

The endpoint has configurable HTTP timeouts and logs request lifecycle events using record IDs, sizes, language codes, provider status/category, and provider request IDs. It does not log API keys, raw audio, or transcript text. There are no automatic retries; callers can retry explicitly after reviewing the error.

The REST docs specify a maximum duration of 60 seconds but do not provide a duration-inspection endpoint or request field. This implementation enforces a configurable byte limit and validates common audio signatures; Gnani remains the authority on duration and may return a 400 for longer files. Configure your reverse proxy/load balancer body-size limit as well, since it can reject oversized requests before FastAPI sees them.

## Tests

Tests use SQLite in-memory and a fake ASR service or `httpx.MockTransport`; they do not make real Gnani requests.

```bash
pytest -q
```

Coverage includes health, missing/invalid/oversized uploads, successful persistence and retrieval, provider failure, database failure, and the documented Gnani URL/header/multipart fields/response parsing.

## Deployment preparation

The backend deploys independently of Vercel. Configure a managed PostgreSQL URL, `GNANI_API_KEY`, exact `ALLOWED_ORIGINS`, upload-size limit, and timeout in the hosting provider's secret/environment manager. Run migrations as a release step:

```bash
alembic upgrade head
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Use HTTPS, a managed database with backups, TLS to PostgreSQL where available, and an upstream body-size limit aligned with `MAX_UPLOAD_SIZE_MB`. Confirm the deployment provider's maximum request duration accommodates synchronous Gnani REST processing. For longer recordings, evaluate Gnani's documented Batch STT API rather than pretending this short-clip REST endpoint is asynchronous.
