import { ApiError } from "@/lib/api/client";
import type { AudioMetadata, Job, JobResult, JobStatus, JobStatusResponse } from "@/lib/api/types";

interface MockJobRecord {
  jobId: string;
  createdAt: number;
  fileName: string;
  fileSize: number;
  fileType: string;
}

const storageKey = "gnani-audio.mock-jobs";
const stageDurationMs = 2_600;
const memoryRecords = new Map<string, MockJobRecord>();

function readRecords(): MockJobRecord[] {
  if (typeof window === "undefined") return Array.from(memoryRecords.values());
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return Array.from(memoryRecords.values());
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Array.from(memoryRecords.values());
    return parsed.filter(isMockJobRecord);
  } catch {
    return Array.from(memoryRecords.values());
  }
}

function isMockJobRecord(value: unknown): value is MockJobRecord {
  if (typeof value !== "object" || value === null) return false;
  return "jobId" in value && typeof value.jobId === "string" &&
    "createdAt" in value && typeof value.createdAt === "number" &&
    "fileName" in value && typeof value.fileName === "string" &&
    "fileSize" in value && typeof value.fileSize === "number" &&
    "fileType" in value && typeof value.fileType === "string";
}

function storeRecord(record: MockJobRecord): void {
  memoryRecords.set(record.jobId, record);
  if (typeof window === "undefined") return;
  const records = readRecords().filter((item) => item.jobId !== record.jobId);
  records.push(record);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(records.slice(-30)));
  } catch {
    // The in-memory record is sufficient until a full page reload.
  }
}

function findRecord(jobId: string): MockJobRecord {
  const record = readRecords().find((item) => item.jobId === jobId) ?? memoryRecords.get(jobId);
  if (!record) throw new ApiError("This demo job could not be found. Upload a new audio file to try again.", 404);
  return record;
}

function makeJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function statusAt(elapsedMs: number): { status: JobStatus; progress: number; message: string } {
  if (elapsedMs < stageDurationMs) return { status: "queued", progress: 8, message: "Waiting in the processing queue" };
  if (elapsedMs < stageDurationMs * 2) return { status: "processing", progress: 22, message: "Preparing your audio" };
  if (elapsedMs < stageDurationMs * 3.2) return { status: "transcribing", progress: 51, message: "Transcribing audio" };
  if (elapsedMs < stageDurationMs * 4) return { status: "summarizing", progress: 82, message: "Creating your summary" };
  return { status: "completed", progress: 100, message: "Your results are ready" };
}

export async function uploadAudio(file: File): Promise<Job> {
  const jobId = makeJobId();
  storeRecord({
    jobId,
    createdAt: Date.now(),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });
  return { job_id: jobId, status: "queued" };
}

export async function getJobStatus(jobId: string, signal?: AbortSignal): Promise<JobStatusResponse> {
  if (signal?.aborted) throw new DOMException("The request was aborted.", "AbortError");
  const record = findRecord(jobId);
  const state = statusAt(Date.now() - record.createdAt);
  return { job_id: jobId, status: state.status, progress: state.progress, message: state.message };
}

export async function getJobResult(jobId: string, signal?: AbortSignal): Promise<JobResult> {
  if (signal?.aborted) throw new DOMException("The request was aborted.", "AbortError");
  const record = findRecord(jobId);
  if (statusAt(Date.now() - record.createdAt).status !== "completed") {
    throw new ApiError("This demo job is still processing. Check its status and try again.", 409);
  }

  const metadata: AudioMetadata = {
    duration: 542,
    language: "en",
    file_name: record.fileName,
    file_size_bytes: record.fileSize
  };

  return {
    job_id: jobId,
    status: "completed",
    transcript: "Today we discussed the progress of the project, the major implementation challenges, and the timeline for completing the next phase. The team agreed to resolve the remaining integration issues before the next review. We will share an updated delivery plan by the end of the week and confirm owners for each outstanding action.",
    summary: "The meeting focused on project progress, implementation challenges, and upcoming deadlines.\n\nKey points:\n• Current implementation is progressing.\n• Several technical issues remain, especially around integration.\n• The next milestone is planned for the coming week.\n\nNext step: Share an updated delivery plan and confirm owners before the next review.",
    metadata
  };
}
