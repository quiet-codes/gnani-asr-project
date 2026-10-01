import { AUDIO_EXTENSIONS, AUDIO_MIME_TYPES, MAX_FILE_SIZE_MB } from "@/lib/constants";

export type FileValidationResult =
  | { valid: true }
  | { valid: false; message: string };

const allowedMimeTypes = new Set<string>(AUDIO_MIME_TYPES);
const allowedExtensions = new Set<string>(AUDIO_EXTENSIONS);

export function validateAudioFile(
  file: File,
  maxSizeMb = MAX_FILE_SIZE_MB
): FileValidationResult {
  if (file.size === 0) {
    return { valid: false, message: "This file is empty. Choose a different audio file." };
  }

  const extension = getExtension(file.name);
  const validMimeType = allowedMimeTypes.has(file.type.toLowerCase());
  const validExtension = allowedExtensions.has(extension);

  if (!validMimeType && !validExtension) {
    return {
      valid: false,
      message: "Choose an audio file in MP3, WAV, M4A, FLAC, OGG, or WebM format."
    };
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return {
      valid: false,
      message: `This file is too large. Maximum allowed size is ${maxSizeMb} MB.`
    };
  }

  return { valid: true };
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}
