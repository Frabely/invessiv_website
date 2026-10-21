// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { FileEntryItem } from "@invessiv/common/contracts/files/file-entry-item";
import { FilePreviewPanel } from "@invessiv/ui";

const labels = {
  label: "Preview",
  empty: "Choose a file to see it here.",
  loading: "Loading preview …",
  error: "The preview could not be loaded.",
  expand: "Full screen",
  download: "Download",
  open: "Open",
  opensInNewTab: "opens in a new tab",
};

function image(overrides: Partial<FileEntryItem> = {}): FileEntryItem {
  return {
    id: "image-1",
    source: FileSource.Upload,
    assetKind: AssetKind.Image,
    displayName: "Logo.png",
    note: "White on dark",
    url: null,
    extension: "png",
    sizeBytes: 2_000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderPanel(
  file: FileEntryItem | null,
  loadSourceAction = vi.fn().mockResolvedValue("https://blob.test/logo.png"),
) {
  const handlers = { onDownloadAction: vi.fn(), onExpandAction: vi.fn() };
  render(
    <FilePreviewPanel
      file={file}
      kindLabel="Image"
      labels={labels}
      loadSourceAction={loadSourceAction}
      locale="en"
      {...handlers}
    />,
  );
  return { loadSourceAction, ...handlers };
}

describe("FilePreviewPanel", () => {
  afterEach(cleanup);

  it("loads nothing while no file is chosen", () => {
    const { loadSourceAction } = renderPanel(null);

    expect(
      screen.getByRole("complementary", { name: "Preview" }),
    ).toBeVisible();
    expect(screen.getByText(labels.empty)).toBeInTheDocument();
    expect(loadSourceAction).not.toHaveBeenCalled();
  });

  it("shows the chosen image with its facts and offers full screen and download", async () => {
    const { loadSourceAction, onDownloadAction, onExpandAction } =
      renderPanel(image());

    expect(
      await screen.findByRole("img", { name: "Logo.png" }),
    ).toHaveAttribute("src", "https://blob.test/logo.png");
    expect(loadSourceAction).toHaveBeenCalledOnce();
    expect(loadSourceAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "image-1" }),
      FilePreviewKind.Image,
    );
    expect(
      screen.getByRole("heading", { name: "Logo.png" }),
    ).toBeInTheDocument();
    expect(screen.getByText("White on dark")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: labels.expand }));
    fireEvent.click(screen.getByRole("button", { name: labels.download }));

    expect(onExpandAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "image-1" }),
    );
    expect(onDownloadAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "image-1" }),
    );
  });

  it("shows the small preview at once and swaps to the original once it has loaded", async () => {
    let resolveSource: (url: string) => void = () => {};
    const loadSourceAction = vi.fn(
      () =>
        new Promise<string | null>((resolve) => {
          resolveSource = resolve;
        }),
    );
    const { container } = render(
      <FilePreviewPanel
        file={image({ thumbnailUrl: "https://blob.test/logo.thumb.webp" })}
        kindLabel="Image"
        labels={labels}
        loadSourceAction={loadSourceAction}
        locale="en"
        onDownloadAction={vi.fn()}
        onExpandAction={vi.fn()}
      />,
    );

    const placeholder = () =>
      container.querySelector('img[src="https://blob.test/logo.thumb.webp"]');
    expect(placeholder()).toBeInTheDocument();
    expect(placeholder()).toHaveAttribute("alt", "");
    expect(screen.queryByText(labels.loading)).not.toBeInTheDocument();

    resolveSource("https://blob.test/logo.png");
    const original = await screen.findByRole("img", { name: "Logo.png" });
    expect(original.closest("[data-loaded]")).toHaveAttribute(
      "data-loaded",
      "false",
    );
    fireEvent.load(original);
    expect(original.closest("[data-loaded]")).toHaveAttribute(
      "data-loaded",
      "true",
    );
  });

  it("names a broken original instead of keeping the small preview forever", async () => {
    renderPanel(image({ thumbnailUrl: "https://blob.test/logo.thumb.webp" }));

    fireEvent.error(await screen.findByRole("img", { name: "Logo.png" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(labels.error);
  });

  it("shows the type instead of loading a file that has no preview", () => {
    const { loadSourceAction } = renderPanel(
      image({
        id: "doc-1",
        assetKind: AssetKind.Document,
        displayName: "Brief.docx",
        extension: "docx",
      }),
    );

    expect(loadSourceAction).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: labels.expand })).toBeNull();
    expect(
      screen.getByRole("button", { name: labels.download }),
    ).toBeInTheDocument();
  });

  it("opens a link in a new tab instead of downloading it", () => {
    renderPanel(
      image({
        id: "link-1",
        source: FileSource.Link,
        assetKind: AssetKind.Link,
        displayName: "Brand film",
        extension: null,
        sizeBytes: null,
        url: "https://drive.google.com/file/1",
      }),
    );

    const link = screen.getByRole("link", {
      name: "Open (opens in a new tab)",
    });
    expect(link).toHaveAttribute("href", "https://drive.google.com/file/1");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByRole("button", { name: labels.download })).toBeNull();
  });
});
