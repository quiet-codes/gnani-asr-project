import type { JobStatus, JobStatusResponse } from "@/lib/api/types";

const stageLabels = ["Queued", "Transcribing", "Summarizing", "Ready"];

function stageFor(status?: JobStatus): number {
  if (status === "failed") return -1;
  if (status === "completed") return 3;
  if (status === "summarizing") return 2;
  if (status === "processing" || status === "transcribing") return 1;
  return 0;
}

function stageName(status?: JobStatus): string {
  if (!status) return "Checking status";
  if (status === "uploading") return "Uploading";
  if (status === "queued") return "Queued";
  if (status === "processing") return "Preparing audio";
  if (status === "transcribing") return "Transcribing";
  if (status === "summarizing") return "Summarizing";
  if (status === "completed") return "Ready";
  return "Stopped";
}

export function ProgressIndicator({ status }: { status: JobStatusResponse | null }) {
  const exactProgress = status?.progress;
  if (exactProgress !== undefined && Number.isFinite(exactProgress)) {
    const percentage = Math.max(0, Math.min(100, Math.round(exactProgress)));
    return (
      <div className="progress-block">
        <div className="progress-caption"><span>PROCESSING PROGRESS</span><strong>{percentage}%</strong></div>
        <div className="exact-progress-track" role="progressbar" aria-label="Audio processing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
          <span style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  }

  const currentStage = status ? stageFor(status.status) : -1;
  const label = stageName(status?.status);
  return (
    <div className="progress-block">
      <div className="progress-caption"><span>PROCESSING STAGE</span><strong>{label}</strong></div>
      <div className="stage-progress" role="img" aria-label={`Stage-based progress: ${label}`}>
        {stageLabels.map((stage, index) => (
          <span key={stage} className={index < currentStage ? "stage-segment stage-done" : index === currentStage ? "stage-segment stage-current" : "stage-segment"} />
        ))}
      </div>
      <div className="stage-labels" aria-hidden="true">
        {stageLabels.map((stage, index) => <span key={stage} className={index === currentStage ? "stage-label-current" : ""}>{stage}</span>)}
      </div>
    </div>
  );
}
