"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ResultsView } from "@/components/results/ResultsView";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Icon } from "@/components/ui/Icon";
import { Loading } from "@/components/ui/Loading";
import { getJobResult } from "@/lib/api/jobs";
import type { JobLocalInfo, JobResult } from "@/lib/api/types";
import { getJobLocalInfo } from "@/lib/job-storage";
import { USE_MOCK_API } from "@/lib/constants";
import { getErrorMessage } from "@/lib/utils";

export function ResultPage({ jobId }: { jobId: string }) {
  const [result, setResult] = useState<JobResult | null>(null);
  const [fileInfo, setFileInfo] = useState<JobLocalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setFileInfo(getJobLocalInfo(jobId));
  }, [jobId]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    setLoading(true);
    setError(null);

    getJobResult(jobId, controller.signal)
      .then((nextResult) => {
        if (isActive) setResult(nextResult);
      })
      .catch((requestError: unknown) => {
        if (isActive && !(requestError instanceof Error && requestError.name === "AbortError")) {
          setError(getErrorMessage(requestError, "Unable to load the results. Please try again."));
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [jobId, retryKey]);

  return (
    <>
      <AppHeader active="job" />
      <main className="page-shell results-page">
        <div className="page-breadcrumb"><Link href="/">Workspace</Link><Icon name="chevron" size={14} /><Link href={`/jobs/${encodeURIComponent(jobId)}`}>Processing</Link><Icon name="chevron" size={14} /><span>Results</span></div>
        <div className="results-page-heading">
          <div>
            <span className="section-kicker">AUDIO JOB COMPLETE</span>
            <h1>Your audio, made clear.</h1>
            <p>Review the key takeaways, then dive into the complete transcript.</p>
          </div>
          <div className="result-heading-badges">
            {USE_MOCK_API ? <span className="demo-output-badge">DEMO DATA · SAMPLE OUTPUT</span> : null}
            <div className="complete-badge"><span><Icon name="check" size={14} /></span>Complete</div>
          </div>
        </div>

        {loading ? <Loading label="Loading transcript and summary…" /> : null}
        {!loading && error ? (
          <div className="result-load-error">
            <ErrorMessage>{error}</ErrorMessage>
            <p>If this job is still running, return to its status page and try again when it completes.</p>
            <div className="result-error-actions">
              <Button variant="secondary" onClick={() => setRetryKey((key) => key + 1)} leadingIcon={<Icon name="refresh" size={16} />}>Try again</Button>
              <Link className="text-link" href={`/jobs/${encodeURIComponent(jobId)}`}>Back to job status</Link>
            </div>
          </div>
        ) : null}
        {!loading && result ? <ResultsView result={result} fileInfo={fileInfo} /> : null}
      </main>
    </>
  );
}
