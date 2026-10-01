import type { JobLocalInfo } from "@/lib/api/types";

const storageKey = "gnani-audio.job-info.";

export function saveJobLocalInfo(jobId: string, info: JobLocalInfo): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(`${storageKey}${jobId}`, JSON.stringify(info));
  } catch {
    // Storage may be unavailable in private browsing; the job still works without local labels.
  }
}

export function getJobLocalInfo(jobId: string): JobLocalInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(`${storageKey}${jobId}`);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === "object" && parsed !== null &&
      "fileName" in parsed && typeof parsed.fileName === "string" &&
      "fileSize" in parsed && typeof parsed.fileSize === "number" &&
      "fileType" in parsed && typeof parsed.fileType === "string" &&
      "createdAt" in parsed && typeof parsed.createdAt === "number"
    ) {
      return parsed as JobLocalInfo;
    }
  } catch {
    return null;
  }
  return null;
}
