import type { JobLocalInfo, JobResult } from "@/lib/api/types";
import { Metadata } from "@/components/results/Metadata";
import { SummaryViewer } from "@/components/results/SummaryViewer";
import { TranscriptViewer } from "@/components/results/TranscriptViewer";

export function ResultsView({ result, fileInfo }: { result: JobResult; fileInfo: JobLocalInfo | null }) {
  const fileName = fileInfo?.fileName ?? result.metadata?.file_name ?? "Audio file";
  return (
    <div className="results-grid">
      <div className="results-main-column">
        <SummaryViewer result={result} />
        <TranscriptViewer result={result} sourceName={fileName} />
      </div>
      <aside className="results-aside">
        <Metadata metadata={result.metadata} fileName={fileName} fileSize={fileInfo?.fileSize} />
        <div className="result-aside-note">
          <span className="aside-note-icon"><span className="aside-sparkle" /></span>
          <div><strong>Keep the conversation moving.</strong><p>Copy the transcript or download a text file to share your notes with the team.</p></div>
        </div>
      </aside>
    </div>
  );
}
