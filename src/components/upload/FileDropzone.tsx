import type { DragEvent } from "react";
import { Icon } from "@/components/ui/Icon";

export function FileDropzone({
  onChoose,
  onFileDrop,
  isDragging,
  setIsDragging,
  maxFileSizeMb
}: {
  onChoose: () => void;
  onFileDrop: (file: File | undefined) => void;
  isDragging: boolean;
  setIsDragging: (active: boolean) => void;
  maxFileSizeMb: number;
}) {
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    onFileDrop(event.dataTransfer.files.item(0) ?? undefined);
  }

  return (
    <div
      className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <div className="dropzone-content">
        <div className="dropzone-icon"><Icon name="upload" size={24} /></div>
        <h3>Drop your audio here</h3>
        <p>or choose a file from your device</p>
        <button type="button" className="browse-button" onClick={onChoose}>
          Browse files <Icon name="arrow-right" size={15} />
        </button>
        <p className="dropzone-formats">MP3, WAV, M4A, FLAC, OGG, or WebM <span>·</span> up to {maxFileSizeMb} MB</p>
      </div>
      <div className="dropzone-corner" aria-hidden="true"><Icon name="music" size={17} /></div>
    </div>
  );
}
