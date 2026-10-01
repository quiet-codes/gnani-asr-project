import type { AudioMetadata, Job, JobResult, JobStatus, JobStatusResponse } from "@/lib/api/types";
import { ApiError, requestJson } from "@/lib/api/client";

const allowedStatuses = new Set<JobStatus>([
  "queued", "uploading", "processing", "transcribing", "summarizing", "completed", "failed"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStatus(value: unknown): JobStatus {
  if (typeof value === "string" && allowedStatuses.has(value as JobStatus)) return value as JobStatus;
  throw new ApiError("The server returned an unknown job status.");
}

function parseJob(value: unknown): Job {
  if (!isRecord(value) || typeof value.job_id !== "string") {
    throw new ApiError("The server returned an invalid job response.");
  }
  return { job_id: value.job_id, status: parseStatus(value.status) };
}

function parseJobStatus(value: unknown): JobStatusResponse {
  if (!isRecord(value) || typeof value.job_id !== "string") {
    throw new ApiError("The server returned an invalid job status response.");
  }
  const progress = typeof value.progress === "number" && Number.isFinite(value.progress)
    ? Math.max(0, Math.min(100, value.progress))
    : undefined;
  return {
    job_id: value.job_id,
    status: parseStatus(value.status),
    ...(progress === undefined ? {} : { progress }),
    ...(typeof value.message === "string" ? { message: value.message } : {})
  };
}

function parseMetadata(value: unknown): AudioMetadata | undefined {
  if (!isRecord(value)) return undefined;
  return {
    ...(typeof value.duration === "number" && Number.isFinite(value.duration) ? { duration: value.duration } : {}),
    ...(typeof value.language === "string" ? { language: value.language } : {}),
    ...(typeof value.file_name === "string" ? { file_name: value.file_name } : {}),
    ...(typeof value.file_size_bytes === "number" ? { file_size_bytes: value.file_size_bytes } : {})
  };
}

function parseResult(value: unknown): JobResult {
  if (
    !isRecord(value) || typeof value.job_id !== "string" ||
    typeof value.transcript !== "string" || typeof value.summary !== "string"
  ) {
    throw new ApiError("The server returned an invalid result response.");
  }
  const status = parseStatus(value.status);
  if (status !== "completed") {
    throw new ApiError("The transcript is not ready yet.");
  }
  const metadata = parseMetadata(value.metadata);
  return {
    job_id: value.job_id,
    status: "completed",
    transcript: value.transcript,
    summary: value.summary,
    ...(metadata ? { metadata } : {})
  };
}

export async function uploadAudio(file: File): Promise<Job> {
  const formData = new FormData();
  formData.append("audio", file, file.name);
  // Do not set Content-Type: the browser must add the multipart boundary.
  const response = await requestJson<unknown>("/api/v1/jobs", {
    method: "POST",
    body: formData
  });
  return parseJob(response);
}

export async function getJobStatus(jobId: string, signal?: AbortSignal): Promise<JobStatusResponse> {
  const response = await requestJson<unknown>(`/api/v1/jobs/${encodeURIComponent(jobId)}`, { signal });
  return parseJobStatus(response);
}

export async function getJobResult(jobId: string, signal?: AbortSignal): Promise<JobResult> {
  const response = await requestJson<unknown>(`/api/v1/jobs/${encodeURIComponent(jobId)}/result`, { signal });
  return parseResult(response);
}
