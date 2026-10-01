import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE_MB } from "@/lib/constants";
import { validateAudioFile } from "@/lib/file-validation";

describe("validateAudioFile", () => {
  it("accepts a supported MP3 by MIME type", () => {
    const file = new File(["audio"], "interview.mp3", { type: "audio/mpeg" });
    expect(validateAudioFile(file)).toEqual({ valid: true });
  });

  it("accepts a supported extension when the browser provides no MIME type", () => {
    const file = new File(["audio"], "recording.wav", { type: "" });
    expect(validateAudioFile(file)).toEqual({ valid: true });
  });

  it("rejects a non-audio file", () => {
    const file = new File(["document"], "notes.pdf", { type: "application/pdf" });
    expect(validateAudioFile(file)).toMatchObject({ valid: false });
  });

  it("rejects files larger than the configured maximum", () => {
    const file = new File(["audio"], "large.mp3", { type: "audio/mpeg" });
    Object.defineProperty(file, "size", { value: MAX_FILE_SIZE_MB * 1024 * 1024 + 1 });
    expect(validateAudioFile(file)).toEqual({
      valid: false,
      message: `This file is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`
    });
  });
});
