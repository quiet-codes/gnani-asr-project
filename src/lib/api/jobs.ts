import { USE_MOCK_API } from "@/lib/constants";
import type { Job, JobResult, JobStatusResponse } from "@/lib/api/types";
import * as mockApi from "@/lib/api/mock-api";
import * as realApi from "@/lib/api/real-api";

/** UI-facing API. Components call this module and never depend on mock/HTTP details. */
export function uploadAudio(file: File): Promise<Job> {
  return USE_MOCK_API ? mockApi.uploadAudio(file) : realApi.uploadAudio(file);
}

export function getJobStatus(jobId: string, signal?: AbortSignal): Promise<JobStatusResponse> {
  return USE_MOCK_API ? mockApi.getJobStatus(jobId, signal) : realApi.getJobStatus(jobId, signal);
}

export function getJobResult(jobId: string, signal?: AbortSignal): Promise<JobResult> {
  return USE_MOCK_API ? mockApi.getJobResult(jobId, signal) : realApi.getJobResult(jobId, signal);
}
