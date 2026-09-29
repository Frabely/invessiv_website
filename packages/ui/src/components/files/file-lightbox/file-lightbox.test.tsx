// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { FilePreviewItem } from "@invessiv/common/contracts/files/file-preview-item";
import type { FileLightboxLabels } from "@invessiv/common/contracts/ui/file-lightbox-labels";
import { FileLightbox } from "@invessiv/ui";

const labels: FileLightboxLabels = {
  close: "Close preview",
  previous: "Previous file",
  next: "Next file",
  position: "{index} of {total}",
  loading: "Loading preview …",
  error: "The preview could not be loaded.",
  download: "Download",
};

function file(
  id: string,
  extension: FilePreviewItem["extension"],
  name: string,
): FilePreviewItem {
  return {
    id,
    source: FileSource.Upload,
    extension,
    sizeBytes: 100,
    displayName: name,
  };
}

const files = [file("a", "png", "logo.png"), file("b", "txt", "notes.txt")];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FileLightbox", () => {
  it("renders images from the inline URL and pages with the arrow keys", async () => {
    const loadSourceAction = vi.fn().mockResolvedValue("https://img");
    const onIndexChangeAction = vi.fn();
    render(
      <FileLightbox
        files={files}
        index={0}
        labels={labels}
        loadSourceAction={loadSourceAction}
        onCloseAction={vi.fn()}
        onDownloadAction={vi.fn()}
        onIndexChangeAction={onIndexChangeAction}
      />,
    );
    expect(await screen.findByAltText("logo.png")).toHaveAttribute(
      "src",
      "https://img",
    );
    expect(loadSourceAction).toHaveBeenCalledWith(
      files[0],
      FilePreviewKind.Image,
    );
    expect(screen.getByText("1 of 2")).toBeVisible();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onIndexChangeAction).toHaveBeenCalledWith(1);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(onIndexChangeAction).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: labels.previous }),
    ).toBeDisabled();
  });

  it("renders text as plain text and closes on Escape", async () => {
    const markup = "<script>alert(1)</script>";
    const onCloseAction = vi.fn();
    render(
      <FileLightbox
        files={files}
        index={1}
        labels={labels}
        loadSourceAction={vi.fn().mockResolvedValue(markup)}
        onCloseAction={onCloseAction}
        onDownloadAction={vi.fn()}
        onIndexChangeAction={vi.fn()}
      />,
    );
    expect(await screen.findByText(markup)).toBeVisible();
    expect(document.querySelector("script")).toBeNull();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onCloseAction).toHaveBeenCalled();
  });

  it("offers the download when the preview cannot load", async () => {
    const onDownloadAction = vi.fn();
    render(
      <FileLightbox
        files={files}
        index={0}
        labels={labels}
        loadSourceAction={vi.fn().mockResolvedValue(null)}
        onCloseAction={vi.fn()}
        onDownloadAction={onDownloadAction}
        onIndexChangeAction={vi.fn()}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(labels.error);
    fireEvent.click(screen.getByRole("button", { name: labels.download }));
    expect(onDownloadAction).toHaveBeenCalledWith(files[0]);
  });
});
