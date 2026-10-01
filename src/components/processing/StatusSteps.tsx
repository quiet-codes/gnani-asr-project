import type { JobStatus } from "@/lib/api/types";
import { Icon } from "@/components/ui/Icon";

const steps = ["File uploaded", "Job created", "Transcribing audio", "Generating summary", "Finalizing results"];

function activeIndex(status: JobStatus | undefined): number {
  if (!status) return 1;
  if (status === "uploading") return 0;
  if (status === "queued") return 1;
  if (status === "processing" || status === "transcribing") return 2;
  if (status === "summarizing") return 3;
  if (status === "completed") return steps.length;
  return -1;
}

export function StatusSteps({ status }: { status?: JobStatus }) {
  const active = activeIndex(status);
  return (
    <ol className="status-steps" aria-label="Processing stages">
      {steps.map((label, index) => {
        const isDone = status === "completed" || (active >= 0 && index < active);
        const isCurrent = status !== "failed" && active === index;
        const stateClass = isDone ? "step-done" : isCurrent ? "step-current" : "step-pending";
        return (
          <li key={label} className={`status-step ${stateClass}`}>
            <span className="step-indicator">
              {isDone ? <Icon name="check" size={14} strokeWidth={2.4} /> : isCurrent ? <span className="step-indicator-dot" /> : <span className="step-number">{String(index + 1).padStart(2, "0")}</span>}
            </span>
            <span className="step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
