"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Job } from "@/lib/api/types";
import { uploadAudio } from "@/lib/api/jobs";
import { AUDIO_ACCEPT, MAX_FILE_SIZE_MB, USE_MOCK_API } from "@/lib/constants";
import { validateAudioFile } from "@/lib/file-validation";
import { getErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Icon } from "@/components/ui/Icon";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { SelectedFile } from "@/components/upload/SelectedFile";

export function AudioUploader({
  onJobCreated
}: {
  onJobCreated: (job: Job, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function acceptFile(file: File | undefined) {
    if (!file) return;
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    setSelectedFile(file);
    setError(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.currentTarget.files?.[0]);
    // Let the same file be selected again after a remove/retry.
    event.currentTarget.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile || error || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const job = await uploadAudio(selectedFile);
      onJobCreated(job, selectedFile);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Upload failed. Please try again."));
      setUploading(false);
    }
  }

  function removeFile() {
    setSelectedFile(null);
    setError(null);
    setIsDragging(false);
  }

  return (
    <form className="uploader-form" onSubmit={handleSubmit} noValidate>
      <input
        ref={inputRef}
        className="visually-hidden-input"
        type="file"
        accept={AUDIO_ACCEPT}
        aria-label="Choose audio file"
        onChange={handleFileChange}
      />

      {selectedFile ? (
        <SelectedFile
          file={selectedFile}
          onReplace={() => inputRef.current?.click()}
          onRemove={removeFile}
        />
      ) : (
        <FileDropzone
          onChoose={() => inputRef.current?.click()}
          onFileDrop={acceptFile}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          maxFileSizeMb={MAX_FILE_SIZE_MB}
        />
      )}

      {error ? <ErrorMessage className="upload-error">{error}</ErrorMessage> : null}

      <div className="upload-submit-row">
        <Button
          type="submit"
          className="generate-button"
          disabled={!selectedFile || Boolean(error) || uploading}
          leadingIcon={uploading ? <Icon name="spinner" size={18} className="spinning-icon" /> : <Icon name="sparkles" size={18} />}
        >
          {uploading ? "Uploading audio…" : "Generate transcript"}
        </Button>
        <span className="upload-limit-note">Maximum file size: {MAX_FILE_SIZE_MB} MB</span>
      </div>
      <p className="upload-caption">
        {USE_MOCK_API ? "Demo mode: your audio stays in this browser; sample results are used." : "Your file is sent to the configured audio processing service."}
      </p>
    </form>
  );
}
