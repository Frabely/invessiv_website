// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FileEntryRow } from "@invessiv/ui";

const labels = {
  opensInNewTab: "Opens in new tab",
  actionsLabel: "Actions for {name}",
  preview: "Preview",
  previewNamed: "Preview {name}",
  download: "Download",
  downloadNamed: "Download {name}",
  open: "Open",
  openNamed: "Open {name}",
  selectNamed: "Select {name}",
};

afterEach(cleanup);

describe("FileEntryRow", () => {
  it("opens a link safely and keeps the selection control in its own slot", () => {
    const onSelect = vi.fn();
    const file = {
      id: "link-1",
      source: FileSource.Link,
      assetKind: AssetKind.Link,
      displayName: "Example",
      note: null,
      url: "https://example.com",
      extension: null,
      sizeBytes: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    render(
      <ul>
        <FileEntryRow
          file={file}
          kindLabel="Link"
          labels={labels}
          locale="en"
          onDownloadAction={vi.fn()}
          onSelectAction={onSelect}
          selected={false}
        />
      </ul>,
    );
    const link = screen.getByRole("link", {
      name: "Example (Opens in new tab)",
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Example" }));
    expect(onSelect).toHaveBeenCalledWith(file);
    expect(
      screen.queryByRole("button", { name: "Download Example" }),
    ).not.toBeInTheDocument();
  });

  it("shows the preview image in place of the kind icon and falls back on error", () => {
    const { container } = render(
      <ul>
        <FileEntryRow
          file={{
            id: "image-1",
            source: FileSource.Upload,
            assetKind: AssetKind.Image,
            displayName: "Moodboard.jpg",
            note: null,
            url: null,
            extension: "jpg",
            sizeBytes: 1000,
            createdAt: "2026-01-01T00:00:00.000Z",
            thumbnailUrl: "https://storage.invalid/moodboard.thumb.webp",
          }}
          kindLabel="Image"
          labels={labels}
          locale="en"
          onDownloadAction={vi.fn()}
          selected={false}
        />
      </ul>,
    );
    const image = container.querySelector("img")!;
    expect(image).toHaveAttribute(
      "src",
      "https://storage.invalid/moodboard.thumb.webp",
    );
    fireEvent.error(image);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("Moodboard.jpg")).toBeInTheDocument();
  });
});
