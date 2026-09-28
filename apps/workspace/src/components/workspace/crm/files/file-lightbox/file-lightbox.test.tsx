// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { getCrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileLightbox } from "./file-lightbox";

const api = vi.hoisted(() => ({
  getDownloadUrl: vi.fn(),
  readText: vi.fn(),
}));
vi.mock("@/client/crm/files-api-service", () => ({ filesApiService: api }));

const content = getCrmFilesDictionary("en");

function file(id: string, extension: FileDto["extension"], name: string) {
  return {
    id,
    source: FileSource.Upload,
    assetKind: AssetKind.Image,
    extension,
    sizeBytes: 100,
    displayName: name,
  } as FileDto;
}

const files = [file("a", "png", "logo.png"), file("b", "txt", "notes.txt")];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FileLightbox", () => {
  it("renders images from the inline URL and pages with the arrow keys", async () => {
    api.getDownloadUrl.mockResolvedValue({ ok: true, value: "https://img" });
    const onIndexChangeAction = vi.fn();
    render(
      <FileLightbox
        content={content}
        files={files}
        index={0}
        onCloseAction={vi.fn()}
        onDownloadAction={vi.fn()}
        onIndexChangeAction={onIndexChangeAction}
      />,
    );
    expect(await screen.findByAltText("logo.png")).toHaveAttribute(
      "src",
      "https://img",
    );
    expect(screen.getByText("1 of 2")).toBeVisible();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onIndexChangeAction).toHaveBeenCalledWith(1);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(onIndexChangeAction).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: content.lightbox.previous }),
    ).toBeDisabled();
  });

  it("renders text as plain text and closes on Escape", async () => {
    const markup = "<script>alert(1)</script>";
    api.readText.mockResolvedValue({ ok: true, value: markup });
    const onCloseAction = vi.fn();
    render(
      <FileLightbox
        content={content}
        files={files}
        index={1}
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
    api.getDownloadUrl.mockResolvedValue({ ok: false, code: "FILE_INTERNAL" });
    const onDownloadAction = vi.fn();
    render(
      <FileLightbox
        content={content}
        files={files}
        index={0}
        onCloseAction={vi.fn()}
        onDownloadAction={onDownloadAction}
        onIndexChangeAction={vi.fn()}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.lightbox.error,
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.lightbox.download }),
    );
    expect(onDownloadAction).toHaveBeenCalledWith(files[0]);
  });
});
