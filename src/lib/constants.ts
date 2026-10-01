export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Status checks are deliberately spaced out to keep the API load modest.
export const POLLING_INTERVAL_MS = 2_500;

export const AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".mp4", ".flac", ".ogg", ".oga", ".webm"] as const;

export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/flac",
  "audio/ogg",
  "audio/webm"
] as const;

export const AUDIO_ACCEPT = [...AUDIO_EXTENSIONS, ...AUDIO_MIME_TYPES].join(",");

// Mock mode is the safe default so a fresh checkout works without FastAPI.
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
