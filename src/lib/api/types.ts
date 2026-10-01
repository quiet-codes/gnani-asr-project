export type JobStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "transcribing"
  | "summarizing"
  | "completed"
  | "failed";

export interface Job {
  job_id: string;
  status: JobStatus;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  /** Present only when the backend can report a real percentage. */
  progress?: number;
  message?: string;
}

export interface AudioMetadata {
  duration?: number;
  language?: string;
  file_name?: string;
  file_size_bytes?: number;
}

export interface JobResult {
  job_id: string;
  status: "completed";
  transcript: string;
  summary: string;
  metadata?: AudioMetadata;
}

export interface JobLocalInfo {
  fileName: string;
  fileSize: number;
  fileType: string;
  createdAt: number;
}
