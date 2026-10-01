import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { getJobStatus, uploadAudio } from "@/lib/api/real-api";

const apiBase = "https://api.example.test";
const fetchMock = vi.fn<typeof fetch>();

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  } as Response;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", apiBase);
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("real jobs API", () => {
  it("uploads the selected file as multipart form data", async () => {
    const file = new File(["sample audio"], "interview.mp3", { type: "audio/mpeg" });
    fetchMock.mockResolvedValueOnce(response({ job_id: "job-123", status: "queued" }, 202));

    await expect(uploadAudio(file)).resolves.toEqual({ job_id: "job-123", status: "queued" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/jobs");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toBeUndefined();
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("audio")).toBeInstanceOf(File);
  });

  it("surfaces backend detail on upload failure", async () => {
    const file = new File(["sample"], "bad.mp3", { type: "audio/mpeg" });
    fetchMock.mockResolvedValueOnce(response({ detail: "Unsupported audio format" }, 415));

    await expect(uploadAudio(file)).rejects.toMatchObject({
      name: "ApiError",
      message: "Unsupported audio format",
      status: 415
    });
  });

  it("returns a typed processing status", async () => {
    fetchMock.mockResolvedValueOnce(response({ job_id: "job-123", status: "transcribing", progress: 45 }));
    await expect(getJobStatus("job-123")).resolves.toEqual({
      job_id: "job-123",
      status: "transcribing",
      progress: 45
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/jobs/job-123");
  });

  it("surfaces failed status requests rather than silently failing", async () => {
    fetchMock.mockResolvedValueOnce(response({ detail: "Job service unavailable" }, 503));
    await expect(getJobStatus("job-123")).rejects.toMatchObject({
      name: "ApiError",
      message: "Job service unavailable",
      status: 503
    });
  });

  it("accepts a completed job marked failed by the processing service", async () => {
    fetchMock.mockResolvedValueOnce(response({ job_id: "job-123", status: "failed", message: "Audio could not be decoded" }));
    await expect(getJobStatus("job-123")).resolves.toMatchObject({
      job_id: "job-123",
      status: "failed",
      message: "Audio could not be decoded"
    });
  });
});
