import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { JobLocalInfo, JobResult } from "@/lib/api/types";
import { ResultsView } from "@/components/results/ResultsView";

const result: JobResult = {
  job_id: "job-complete",
  status: "completed",
  transcript: "This is the complete transcript from the meeting.",
  summary: "The team agreed on the next steps.\n\nKey point: share an updated plan.",
  metadata: { duration: 542, language: "en" }
};

const fileInfo: JobLocalInfo = {
  fileName: "team-meeting.mp3",
  fileSize: 3_400_000,
  fileType: "audio/mpeg",
  createdAt: 1_700_000_000_000
};

describe("completed results UI", () => {
  it("renders summary, full transcript, metadata, and transcript actions", () => {
    render(<ResultsView result={result} fileInfo={fileInfo} />);

    expect(screen.getByRole("heading", { name: "AI Summary" })).toBeInTheDocument();
    expect(screen.getByText(/team agreed on the next steps/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Transcript" })).toBeInTheDocument();
    expect(screen.getByText(result.transcript)).toBeInTheDocument();
    expect(screen.getByText("team-meeting.mp3")).toBeInTheDocument();
    expect(screen.getByText("9:02")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy transcript/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download .txt/i })).toBeInTheDocument();
  });
});
