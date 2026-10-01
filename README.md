# Gnani AI · Audio Intelligence

A responsive Next.js frontend for uploading audio, tracking an asynchronous transcription job, and reviewing its transcript and AI-generated summary. The UI talks only to the FastAPI service: Gnani ASR, LLM calls, storage, and job processing belong in the backend.

```text
Next.js frontend  →  FastAPI backend  →  audio / ASR / summary pipeline
```

The application opens in **mock mode by default**, so you can demonstrate the complete experience without a running backend. Mock responses are visibly labelled as demo data and are isolated from the real HTTP adapter.

## Requirements

- Node.js 20.9+ (Node 20.20+ or Node 22 LTS recommended for Next.js 16)
- npm
- Optional: a FastAPI service implementing the API contract below

## Install and run

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open the local Next.js URL printed in the terminal. The dev script binds to `0.0.0.0` for preview/container environments.

### Environment variables

Copy `.env.local.example` to `.env.local` and adjust as needed:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK_API=true
```

- `NEXT_PUBLIC_USE_MOCK_API=true` uses local mock functions. This is the default when the variable is unset.
- Set `NEXT_PUBLIC_USE_MOCK_API=false` to use the real FastAPI adapter.
- When mock mode is disabled, `NEXT_PUBLIC_API_BASE_URL` is required. `next.config.ts` uses it to proxy same-origin `/api/v1/*` requests to the backend.
- Browser code always fetches a relative `/api/v1/...` URL; it never calls `localhost` directly. The Next.js server performs the rewrite using this configured base URL.
- Restart the Next.js process after changing environment variables.

The sample `localhost` value is configuration, not a URL embedded in UI components. Do not add credentials or secrets to `.env.local` values with a `NEXT_PUBLIC_` prefix.

## Mock mode

Mock mode runs the same screen flow and the same UI-facing functions as the real adapter:

1. `uploadAudio(file)` creates a local demo job ID and stores only non-sensitive display metadata (name, size, MIME type, creation time) in browser local storage.
2. `getJobStatus(jobId)` advances through queued, processing, transcribing, summarizing, and completed stages based on elapsed time. The progress numbers are illustrative mock values, not backend telemetry.
3. `getJobResult(jobId)` returns an explicitly fake sample transcript, summary, duration, and language.

No audio is uploaded or transcribed in mock mode. The header shows **Demo workspace**. Change the flag to `false` to switch the API facade to real HTTP calls; the React screens do not change.

## Backend API contract assumed by the frontend

Set `NEXT_PUBLIC_API_BASE_URL` to the FastAPI origin. Real mode calls:

### Create an asynchronous job

```http
POST {NEXT_PUBLIC_API_BASE_URL}/api/v1/jobs
Content-Type: multipart/form-data
```

Multipart field: `audio=<file>` (the browser creates the multipart boundary; the client deliberately does not set `Content-Type` itself).

Expected response:

```json
{ "job_id": "abc123", "status": "queued" }
```

### Read status

```http
GET {NEXT_PUBLIC_API_BASE_URL}/api/v1/jobs/{job_id}
```

Expected response (progress is optional):

```json
{ "job_id": "abc123", "status": "transcribing", "progress": 45 }
```

Recognized statuses: `queued`, `uploading`, `processing`, `transcribing`, `summarizing`, `completed`, and `failed`. If `progress` is omitted, the UI presents stage-based progress rather than inventing a percentage. FastAPI errors can use the conventional `{ "detail": "Unsupported audio format" }` response.

### Read completed result

```http
GET {NEXT_PUBLIC_API_BASE_URL}/api/v1/jobs/{job_id}/result
```

Expected response:

```json
{
  "job_id": "abc123",
  "status": "completed",
  "transcript": "The full transcript...",
  "summary": "Plain-text summary...",
  "metadata": { "duration": 542, "language": "en" }
}
```

`summary` is rendered as plain text (including line breaks), not interpreted as Markdown. `metadata.duration` is seconds. `metadata.language` may be a language code. Additional optional metadata accepted by the frontend: `file_name` and `file_size_bytes`.

## Data flow

1. A file is selected or dropped in `AudioUploader` and validated in `lib/file-validation.ts` before any request.
2. The upload handler calls `uploadAudio(file)` in `lib/api/jobs.ts`.
3. The API facade chooses `mock-api.ts` or `real-api.ts`. Real mode posts a `FormData` body to `POST /api/v1/jobs` through `lib/api/client.ts`.
4. The returned job ID is saved with browser-only display metadata and the router opens `/jobs/{jobId}`.
5. `ProcessingPage` polls the status endpoint immediately, then every `POLLING_INTERVAL_MS` (2,500 ms) while the job is non-terminal. It stops on `completed`, `failed`, a request error, or unmount.
6. On completion, the router opens `/jobs/{jobId}/result`. `ResultPage` fetches the result once and stores it in component state.
7. `ResultsView` renders the summary, transcript, and optional metadata. `ResultActions` copies the transcript or creates a `.txt` download entirely in the browser.

## Folder structure

```text
src/
├── app/                         Next.js App Router routes and global styles
│   ├── page.tsx                 / upload entry route
│   └── jobs/[jobId]/             processing route
│       ├── page.tsx              /jobs/{jobId}
│       └── result/page.tsx       /jobs/{jobId}/result
├── components/
│   ├── home/                     Upload-page composition
│   ├── upload/                   Dropzone, file details, audio preview, submit flow
│   ├── processing/               Polling screen, stage list, progress presentation
│   ├── results/                  Transcript, summary, metadata, copy/download actions
│   ├── ui/                       Buttons, icons, loading and error primitives
│   └── AppHeader.tsx             Shared navigation and mock/live indicator
└── lib/
    ├── api/                      Typed API contracts, HTTP client, real/mock adapters
    ├── constants.ts              File-size limit, accepted formats, polling interval, mode
    ├── file-validation.ts        Client-side audio validation
    ├── job-storage.ts            Non-sensitive per-tab labels for processing/results
    └── utils.ts                  Formatting, error, and text-download helpers

next.config.ts                    Same-origin API proxy to NEXT_PUBLIC_API_BASE_URL
.env.local.example                Safe local environment-variable template
tailwind.config.ts                Tailwind content paths and theme tokens
vitest.config.mts                 React/Vitest test configuration
```

## Testing and checks

```bash
npm test
npm run typecheck
npm run build
```

The tests cover supported/invalid/oversized files, multipart upload and API failures/status, uploader selection/removal/button/error states, and completed results rendering.

## A. Entry point

Next.js starts at `src/app/layout.tsx`, which installs the global stylesheet and document metadata. The root URL is `src/app/page.tsx`; it renders `HomeScreen` from `src/components/home/HomeScreen.tsx`. The page shell contains the shared header, product introduction, and `AudioUploader`.

## B. Upload flow

```text
Choose / drop file
→ FileDropzone / hidden file input
→ AudioUploader.acceptFile()
→ validateAudioFile(file)
→ selectedFile React state
→ AudioUploader.handleSubmit()
→ uploadAudio(file)
```

- `FileDropzone.tsx` handles drag/drop and invokes the hidden input's chooser callback.
- `AudioUploader.tsx` owns `selectedFile`, `error`, and `uploading`. `handleFileChange` and `acceptFile` keep invalid files from reaching the API.
- `src/lib/file-validation.ts` checks the configurable 100 MB default (`MAX_FILE_SIZE_MB` in `src/lib/constants.ts`), supported MIME types, and extensions when browser MIME detection is missing.
- `SelectedFile.tsx` shows filename, size, detected format, replace/remove actions, and `AudioPreview.tsx` previews the selected local file via a revocable object URL.
- Clicking **Generate transcript** invokes `handleSubmit`, which calls the API facade. The upload button is disabled without a valid selection, after a validation error, or while upload is in progress.

## C. Backend communication

The component calls `uploadAudio(file)` in `src/lib/api/jobs.ts`; it does not call `fetch` itself.

- In real mode, `src/lib/api/real-api.ts` creates a `FormData`, appends the file under the field name `audio`, and calls `requestJson` in `src/lib/api/client.ts`.
- The browser sends `POST /api/v1/jobs` to the same origin with a `multipart/form-data` body. `next.config.ts` rewrites it to `{NEXT_PUBLIC_API_BASE_URL}/api/v1/jobs`; the browser supplies the correct multipart boundary.
- The expected response is a typed job object: `{ job_id: string, status: JobStatus }`.
- The client maps network failures to an understandable connection error, extracts FastAPI `detail` messages, and validates response fields/statuses. The backend base URL is read from the environment; it is not embedded in a component.

## D. Job polling

`ProcessingPage` (`src/components/processing/ProcessingPage.tsx`) starts polling in a React effect as soon as `/jobs/{jobId}` mounts. It calls `getJobStatus(jobId)` immediately, then schedules one next check after `POLLING_INTERVAL_MS` in `src/lib/constants.ts` (2.5 seconds). A recursive timeout prevents overlapping requests.

Polling stops when the backend reports `completed` (navigate to results) or `failed` (show a failure panel), when a status request errors (show a manual retry action), or when the component unmounts. Effect cleanup clears the pending timeout and aborts the active HTTP request with `AbortController`; late responses are ignored. The polling interval is therefore bounded by the job reaching a terminal state or the user leaving/retrying the screen.

## E. Results

`ResultPage` (`src/components/results/ResultPage.tsx`) requests `getJobResult(jobId)` once after `/jobs/{jobId}/result` mounts. The returned typed `JobResult` is stored in the `result` React state. An abort controller cancels the request if the page unmounts.

`ResultsView` passes the result to `SummaryViewer`, `TranscriptViewer`, and `Metadata`. Transcript and summary are rendered as React text, never injected as HTML or evaluated as Markdown. `ResultActions` uses `navigator.clipboard.writeText()` for copying and `downloadTextFile()` to create a `.txt` Blob download client-side.

## F. Mock mode

`src/lib/api/jobs.ts` is the one UI-facing API facade. It reads `USE_MOCK_API` from `src/lib/constants.ts` and delegates each of `uploadAudio`, `getJobStatus`, and `getJobResult` to either `mock-api.ts` or `real-api.ts`. The screen components import only the facade, so switching the environment flag requires no UI rewrite.

The mock adapter simulates job timing and keeps lightweight demo job metadata in local storage so route refreshes work. Its transcript/summary are hard-coded illustrative fixtures in `mock-api.ts`; this data is never returned when `NEXT_PUBLIC_USE_MOCK_API=false`.

## G. Security

There are no Gnani, LLM, database, or other API secrets in this frontend. `NEXT_PUBLIC_*` values are compiled into browser-visible code, so only the non-secret API base URL and mock-mode switch belong there. In real mode, the browser posts to the same-origin Next.js `/api/v1/*` path and the Next.js server rewrites it to the configured FastAPI endpoint; the browser does not call `localhost` directly. The backend must own authentication (if required), authorization, validation, storage, Gnani ASR credentials, LLM credentials, and all server-side processing. The UI renders server-returned text as escaped React text. Use HTTPS for the frontend and backend in production; configure CORS only if you later choose to bypass the Next.js proxy and call FastAPI directly from the browser.

## H. Reverse-engineering map

```text
User chooses a file
  ↓ [FileDropzone button / hidden input: src/components/upload/FileDropzone.tsx + AudioUploader.tsx]
AudioUploader state
  ↓ [AudioUploader.acceptFile() stores selectedFile]
File validation
  ↓ [validateAudioFile(): src/lib/file-validation.ts; limits from src/lib/constants.ts]
Generate transcript button
  ↓ [AudioUploader.handleSubmit()]
API facade
  ↓ [uploadAudio(): src/lib/api/jobs.ts]
Real adapter or mock adapter
  ↓ [real-api.ts → FormData + requestJson() in client.ts; or mock-api.ts]
Same-origin POST /api/v1/jobs
  ↓ [Next.js rewrite in next.config.ts → NEXT_PUBLIC_API_BASE_URL/api/v1/jobs]
FastAPI POST /api/v1/jobs
  ↓ [response parsed as Job: real-api.ts]
Job ID saved and route opened
  ↓ [HomeScreen.handleJobCreated(): job-storage.ts + router.push()]
Processing page
  ↓ [src/app/jobs/[jobId]/page.tsx → ProcessingPage]
Status polling
  ↓ [ProcessingPage effect → getJobStatus(): jobs.ts → real-api.ts/client.ts]
Same-origin GET /api/v1/jobs/{job_id}
  ↓ [Next.js rewrite in next.config.ts]
FastAPI GET /api/v1/jobs/{job_id}
  ↓ [completed triggers router.replace()]
Result page
  ↓ [src/app/jobs/[jobId]/result/page.tsx → ResultPage → getJobResult() → same-origin GET /api/v1/jobs/{job_id}/result → Next.js rewrite]
FastAPI result → transcript + summary
  ↓ [ResultPage result state → ResultsView → SummaryViewer / TranscriptViewer]
Copy / download
  ↓ [ResultActions → navigator.clipboard / downloadTextFile()]
```
