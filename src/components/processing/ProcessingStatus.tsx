import type { JobStatusResponse } from "@/lib/api/types";
import { formatFileSize } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { ProgressIndicator } from "@/components/processing/ProgressIndicator";
import { StatusSteps } from "@/components/processing/StatusSteps";

function statusTitle(status?: JobStatusResponse["status"]): string {
  if (!status) return "Connecting to your job";
  if (status === "queued") return "Your audio is in the queue";
  if (status === "uploading") return "Finishing your upload";
  if (status === "processing") return "Preparing your audio";
  if (status === "transcribing") return "Transcribing your audio";
  if (status === "summarizing") return "Creating your summary";
  if (status === "completed") return "Your results are ready";
  return "Processing couldn’t be completed";
}

function statusDescription(status?: JobStatusResponse["status"]): string {
  if (!status || status === "queued") return "We’ll move through each step automatically. You can leave this page open while we work.";
  if (status === "uploading") return "Your audio is being handed off to the processing service.";
  if (status === "processing") return "We’re preparing the audio before generating your transcript.";
  if (status === "transcribing") return "Speech is being converted into a readable transcript.";
  if (status === "summarizing") return "The transcript is ready. We’re identifying the most useful takeaways.";
  if (status === "completed") return "Transcript and summary are ready to review.";
  return "The processing job stopped before results were ready.";
}

export function ProcessingStatus({
  status,
  fileName,
  fileSize
}: {
  status: JobStatusResponse | null;
  fileName: string;
  fileSize?: number;
}) {
  const isFailed = status?.status === "failed";
  return (
    <section className={`processing-card ${isFailed ? "processing-card-failed" : ""}`} aria-labelledby="processing-title">
      <div className="processing-card-heading">
        <span className={`processing-orb ${isFailed ? "processing-orb-failed" : ""}`}>
          {isFailed ? <Icon name="alert" size={22} /> : status?.status === "completed" ? <Icon name="check" size={22} /> : <Icon name="wave" size={22} />}
        </span>
        <div className="processing-heading-copy">
          <div className="processing-overline"><span className={`status-live-dot ${isFailed ? "status-dot-failed" : ""}`} />{status?.status ? status.status.replaceAll("_", " ") : "connecting"}</div>
          <h2 id="processing-title">{statusTitle(status?.status)}</h2>
          <p>{statusDescription(status?.status)}</p>
        </div>
      </div>

      <div className="processing-file-row">
        <span className="processing-file-icon"><Icon name="music" size={17} /></span>
        <span className="processing-file-name" title={fileName}>{fileName}</span>
        {fileSize !== undefined ? <span className="processing-file-size">{formatFileSize(fileSize)}</span> : null}
      </div>

      <ProgressIndicator status={status} />
      <StatusSteps status={status?.status} />
    </section>
  );
}
