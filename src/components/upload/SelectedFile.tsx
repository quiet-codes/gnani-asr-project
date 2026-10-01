"use client";

import { useCallback, useState } from "react";
import { AudioPreview } from "@/components/upload/AudioPreview";
import { Icon } from "@/components/ui/Icon";
import { formatAudioType, formatDuration, formatFileSize } from "@/lib/utils";

export function SelectedFile({
  file,
  onReplace,
  onRemove
}: {
  file: File;
  onReplace: () => void;
  onRemove: () => void;
}) {
  const [duration, setDuration] = useState<number | undefined>();
  const updateDuration = useCallback((value: number | undefined) => setDuration(value), []);
  const formattedDuration = formatDuration(duration);

  return (
    <div className="selected-file-card">
      <div className="selected-file-top">
        <div className="selected-file-icon"><Icon name="music" size={21} /></div>
        <div className="selected-file-info">
          <p className="selected-file-name" title={file.name}>{file.name}</p>
          <div className="selected-file-meta">
            <span>{formatFileSize(file.size)}</span>
            <span className="meta-separator" aria-hidden="true">·</span>
            <span>{formatAudioType(file.name, file.type)}</span>
            {formattedDuration ? <><span className="meta-separator" aria-hidden="true">·</span><span>{formattedDuration}</span></> : null}
          </div>
        </div>
        <div className="selected-file-actions">
          <button type="button" className="text-action" onClick={onReplace} aria-label="Replace selected audio file">
            <Icon name="replace" size={16} /> <span>Replace</span>
          </button>
          <button type="button" className="icon-action remove-action" onClick={onRemove} aria-label={`Remove ${file.name}`} title="Remove file">
            <Icon name="trash" size={17} />
          </button>
        </div>
      </div>
      <AudioPreview file={file} onDurationChange={updateDuration} />
    </div>
  );
}
