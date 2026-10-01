"use client";

import { useEffect, useState } from "react";

export function AudioPreview({
  file,
  onDurationChange
}: {
  file: File;
  onDurationChange: (duration: number | undefined) => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof URL.createObjectURL !== "function") {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    onDurationChange(undefined);
    return () => URL.revokeObjectURL(url);
  }, [file, onDurationChange]);

  if (!objectUrl) {
    return <p className="preview-unavailable">Audio preview is unavailable in this browser.</p>;
  }

  return (
    <div className="audio-preview">
      <div className="audio-preview-heading"><span className="audio-live-dot" />Audio preview</div>
      <audio
        controls
        preload="metadata"
        src={objectUrl}
        aria-label={`Preview ${file.name}`}
        onLoadedMetadata={(event) => {
          const duration = event.currentTarget.duration;
          onDurationChange(Number.isFinite(duration) ? duration : undefined);
        }}
      >
        Your browser does not support audio playback.
      </audio>
      <span className="audio-preview-time">Preview before upload</span>
    </div>
  );
}
