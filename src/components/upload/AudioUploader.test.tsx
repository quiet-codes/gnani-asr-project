import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AudioUploader } from "@/components/upload/AudioUploader";

function chooseFile(file: File) {
  fireEvent.change(screen.getByLabelText("Choose audio file"), { target: { files: [file] } });
}

describe("AudioUploader", () => {
  it("keeps generate disabled until a supported file is selected, then allows removal", () => {
    render(<AudioUploader onJobCreated={vi.fn()} />);
    const generateButton = screen.getByRole("button", { name: /generate transcript/i });
    expect(generateButton).toBeDisabled();

    chooseFile(new File(["audio"], "interview.mp3", { type: "audio/mpeg" }));
    expect(screen.getByText("interview.mp3")).toBeInTheDocument();
    expect(generateButton).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Remove interview.mp3" }));
    expect(screen.queryByText("interview.mp3")).not.toBeInTheDocument();
    expect(generateButton).toBeDisabled();
  });

  it("shows a clear error and keeps upload disabled for an invalid file", () => {
    render(<AudioUploader onJobCreated={vi.fn()} />);
    chooseFile(new File(["not audio"], "notes.txt", { type: "text/plain" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/choose an audio file/i);
    expect(screen.getByRole("button", { name: /generate transcript/i })).toBeDisabled();
  });
});
