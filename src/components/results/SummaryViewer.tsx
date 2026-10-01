import type { JobResult } from "@/lib/api/types";
import { Icon } from "@/components/ui/Icon";

export function SummaryViewer({ result }: { result: JobResult }) {
  return (
    <section className="summary-card" aria-labelledby="summary-title">
      <div className="summary-heading-row">
        <span className="summary-icon"><Icon name="sparkles" size={19} /></span>
        <div><span className="summary-kicker">THE SHORT VERSION</span><h2 id="summary-title">AI Summary</h2></div>
        <span className="summary-badge">GENERATED</span>
      </div>
      <p className="summary-copy">{result.summary || "No summary was returned for this job."}</p>
      <div className="summary-note"><span className="summary-note-mark"><Icon name="check" size={13} /></span>Review the full transcript for exact wording and context.</div>
    </section>
  );
}
