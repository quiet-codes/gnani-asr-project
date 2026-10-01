"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { ProcessingStatus } from "@/components/processing/ProcessingStatus";
import { getJobStatus } from "@/lib/api/jobs";
import type { JobLocalInfo, JobStatusResponse } from "@/lib/api/types";
import { POLLING_INTERVAL_MS } from "@/lib/constants";
import { getJobLocalInfo } from "@/lib/job-storage";
import { getErrorMessage } from "@/lib/utils";

export function ProcessingPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [fileInfo, setFileInfo] = useState<JobLocalInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [pollError, setPollError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setFileInfo(getJobLocalInfo(jobId));
  }, [jobId]);

  useEffect(() => {
    let isActive = true;
    let timer: number | undefined;
    let controller: AbortController | undefined;

    async function poll() {
      controller = new AbortController();
      try {
        const nextStatus = await getJobStatus(jobId, controller.signal);
        if (!isActive) return;
        setStatus(nextStatus);
        setPollError(null);
        setChecking(false);

        if (nextStatus.status === "completed") {
          router.replace(`/jobs/${encodeURIComponent(jobId)}/result`);
          return;
        }
        if (nextStatus.status === "failed") return;
        timer = window.setTimeout(() => { void poll(); }, POLLING_INTERVAL_MS);
      } catch (error) {
        if (!isActive || (error instanceof Error && error.name === "AbortError")) return;
        setPollError(getErrorMessage(error, "Unable to check processing status. Please try again."));
        setChecking(false);
      }
    }

    setChecking(true);
    setPollError(null);
    void poll();

    return () => {
      isActive = false;
      if (timer !== undefined) window.clearTimeout(timer);
      controller?.abort();
    };
  }, [jobId, retryKey, router]);

  const isFailed = status?.status === "failed";
  const failureMessage = status?.message || "Something went wrong while processing your audio.";

  return (
    <>
      <AppHeader active="job" />
      <main className="page-shell processing-main">
        <div className="page-breadcrumb"><Link href="/">Workspace</Link><Icon name="chevron" size={14} /><span>Processing job</span></div>
        <div className="processing-page-heading">
          <div>
            <span className="section-kicker">JOB IN PROGRESS</span>
            <h1>Good things take a moment.</h1>
            <p>Your audio is moving through the transcription pipeline. This page updates automatically.</p>
          </div>
          <div className="job-id-chip"><span>JOB ID</span><code>{jobId}</code></div>
        </div>

        {pollError ? (
          <div className="processing-error-wrap">
            <ErrorMessage>{pollError}</ErrorMessage>
            <Button variant="secondary" leadingIcon={<Icon name="refresh" size={16} />} onClick={() => setRetryKey((key) => key + 1)}>
              Retry status check
            </Button>
          </div>
        ) : null}

        <ProcessingStatus
          status={status}
          fileName={fileInfo?.fileName ?? "Uploaded audio"}
          fileSize={fileInfo?.fileSize}
        />

        {checking && !status && !pollError ? <Loading label="Checking processing status…" /> : null}

        {isFailed ? (
          <div className="failed-job-panel" role="alert">
            <span className="failed-job-icon"><Icon name="alert" size={20} /></span>
            <div><strong>Something went wrong while processing your audio.</strong><p>{failureMessage}</p></div>
            <Link className="button button-primary" href="/">Try again</Link>
          </div>
        ) : null}

        {!isFailed && !pollError ? (
          <p className="processing-reassurance"><Icon name="info" size={15} />You can safely keep this tab open. We’ll take you to the results when they’re ready.</p>
        ) : null}
      </main>
    </>
  );
}
