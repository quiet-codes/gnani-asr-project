import type { JobResult } from "@/lib/api/types";
import { countWords } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ResultActions } from "@/components/results/ResultActions";

export function TranscriptViewer({ result, sourceName }: { result: JobResult; sourceName: string }) {
  const wordCount = countWords(result.transcript);
  return (
    <section className="result-card transcript-card" aria-labelledby="transcript-title">
      <div className="result-card-heading">
        <div className="result-title-group">
          <span className="result-icon transcript-icon"><Icon name="transcript" size={19} /></span>
          <div><span className="section-kicker">FULL RECORD</span><h2 id="transcript-title">Transcript</h2></div>
        </div>
        <span className="result-heading-note">{wordCount.toLocaleString()} words</span>
      </div>
      <div className="transcript-scroll" tabIndex={0} aria-label="Transcript text, scrollable">
        <p>{result.transcript || "No transcript text was returned for this job."}</p>
      </div>
      <div className="transcript-card-footer">
        <span className="transcript-footer-note"><Icon name="info" size={14} />Complete transcript · scroll to read</span>
        <ResultActions transcript={result.transcript} sourceName={sourceName} />
      </div>
    </section>
  );
}
