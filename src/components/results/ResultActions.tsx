"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { downloadTextFile, makeDownloadName } from "@/lib/utils";

export function ResultActions({ transcript, sourceName }: { transcript: string; sourceName: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
  }, []);

  async function copyTranscript() {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
      setCopyError("Clipboard access isn’t available. You can select and copy the transcript text instead.");
    }
  }

  function downloadTranscript() {
    downloadTextFile(makeDownloadName(sourceName), transcript);
  }

  return (
    <div className="result-actions-wrap">
      <div className="result-actions">
        <Button variant="secondary" className="action-button" onClick={copyTranscript} leadingIcon={<Icon name={copied ? "check" : "copy"} size={16} />}>
          {copied ? "Copied" : "Copy transcript"}
        </Button>
        <Button variant="ghost" className="action-button download-action" onClick={downloadTranscript} leadingIcon={<Icon name="download" size={16} />}>
          Download .txt
        </Button>
      </div>
      <span className="copy-feedback" aria-live="polite">{copied ? "Transcript copied to clipboard." : ""}</span>
      {copyError ? <span className="copy-error" role="status">{copyError}</span> : null}
    </div>
  );
}
