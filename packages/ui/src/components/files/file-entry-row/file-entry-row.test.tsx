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

  it("opens the file from the whole row without an extra preview button", () => {
    const onPreview = vi.fn();
    const onSelect = vi.fn();
    const file = {
      id: "image-1",
      source: FileSource.Upload,
      assetKind: AssetKind.Image,
      displayName: "Logo.png",
      note: null,
      url: null,
      extension: "png" as const,
      sizeBytes: 2_000,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    render(
      <ul>
        <FileEntryRow
          file={file}
          kindLabel="Image"
          labels={labels}
          locale="en"
          onDownloadAction={vi.fn()}
          onPreviewAction={onPreview}
          onSelectAction={onSelect}
          openOnRowClick
          selected={false}
        />
      </ul>,
    );

    expect(screen.getByRole("listitem")).toHaveAttribute(
      "data-row-target",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: "Preview Logo.png" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Logo.png" }));
    expect(onPreview).toHaveBeenCalledWith(file);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Logo.png" }));
    expect(onSelect).toHaveBeenCalledWith(file);
    expect(onPreview).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "Download Logo.png" }),
    ).toBeInTheDocument();
  });

  it("marks the file shown next to the list as current", () => {
    render(
      <ul>
        <FileEntryRow
          active
          file={{
            id: "image-1",
            source: FileSource.Upload,
            assetKind: AssetKind.Image,
            displayName: "Logo.png",
            note: null,
            url: null,
            extension: "png",
            sizeBytes: 2_000,
            createdAt: "2026-01-01T00:00:00.000Z",
          }}
          kindLabel="Image"
          labels={labels}
          locale="en"
          onDownloadAction={vi.fn()}
          onPreviewAction={vi.fn()}
          selected={false}
        />
      </ul>,
    );

    expect(screen.getByRole("button", { name: "Logo.png" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("listitem")).toHaveAttribute("data-active", "true");
  });
});
