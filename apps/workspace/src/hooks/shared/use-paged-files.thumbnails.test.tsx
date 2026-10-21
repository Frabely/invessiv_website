// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { FileListLoadStatus } from "@/common/constants/files/file-list-load-status";
import type { FileThumbnailCandidate } from "@/common/contracts/files/file-thumbnail-candidate";
import { usePagedFiles } from "./use-paged-files";

function image(
  overrides: Partial<FileThumbnailCandidate> = {},
): FileThumbnailCandidate {
  return {
    id: "image",
    assetKind: AssetKind.Image,
    source: FileSource.Upload,
    extension: UploadExtension.Png,
    thumbnailUrl: null,
    ...overrides,
  };
}
const page = (files: FileThumbnailCandidate[]) => ({
  files,
  total: files.length,
  page: 1,
  pageSize: 25,
});
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("file list thumbnail refresh", () => {
  it("picks up a delayed preview without clearing the list or its metadata", async () => {
    const original = image();
    const load = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: page([original]) })
      .mockResolvedValueOnce({
        ok: true,
        value: page([
          image({ thumbnailUrl: "https://storage.invalid/preview" }),
        ]),
      });
    const { result } = renderHook(() =>
      usePagedFiles("scope", load, page([original])),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(result.current.files).toEqual([original]);
    expect(result.current.status).toBe(FileListLoadStatus.Ready);
    expect(result.current.total).toBe(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(result.current.files[0].thumbnailUrl).toBe(
      "https://storage.invalid/preview",
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("stops after five attempts and keeps existing data on background failures", async () => {
    const original = image();
    const load = vi.fn().mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() =>
      usePagedFiles("scope", load, page([original])),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(load).toHaveBeenCalledTimes(5);
    expect(result.current.files).toEqual([original]);
    expect(result.current.status).toBe(FileListLoadStatus.Ready);
  });

  it("does not poll unsupported formats, documents or existing previews", async () => {
    const load = vi.fn();
    renderHook(() =>
      usePagedFiles(
        "scope",
        load,
        page([
          image({ id: "heic", extension: UploadExtension.Heic }),
          image({ id: "svg", extension: UploadExtension.Svg }),
          image({ id: "document", assetKind: AssetKind.Document }),
          image({ id: "ready", thumbnailUrl: "https://storage.invalid/ready" }),
        ]),
      ),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(load).not.toHaveBeenCalled();
  });

  it("ignores a background response from the previous scope", async () => {
    let resolve: (value: unknown) => void = () => {};
    const load = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      )
      .mockResolvedValue({ ok: true, value: page([]) });
    const { result, rerender } = renderHook(
      ({ scope }) => usePagedFiles(scope, load, page([image()])),
      { initialProps: { scope: "first" } },
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    await act(async () => {
      rerender({ scope: "second" });
    });
    await act(async () => {
      resolve({
        ok: true,
        value: page([image({ thumbnailUrl: "https://storage.invalid/old" })]),
      });
    });
    expect(result.current.files).toEqual([]);
  });

  it("preserves newer local edits while applying only the delayed thumbnail", async () => {
    let resolve: (value: unknown) => void = () => {};
    const original = { ...image(), note: "old note" };
    const load = vi.fn().mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const { result } = renderHook(() =>
      usePagedFiles("scope", load, { ...page([original]), files: [original] }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    act(() => {
      result.current.replace({ ...original, note: "new note" });
    });
    await act(async () => {
      resolve({
        ok: true,
        value: page([
          { ...original, thumbnailUrl: "https://storage.invalid/preview" },
        ]),
      });
    });
    expect(result.current.files[0]).toMatchObject({
      note: "new note",
      thumbnailUrl: "https://storage.invalid/preview",
    });
  });

  it("refreshes previews on all loaded pages without resetting pagination", async () => {
    const first = image({ id: "first" });
    const second = image({ id: "second" });
    const load = vi.fn().mockImplementation(async (number: number) => ({
      ok: true,
      value: {
        files: [
          image({
            id: number === 1 ? "first" : "second",
            thumbnailUrl: "https://storage.invalid/preview",
          }),
        ],
        total: 2,
        page: number,
        pageSize: 1,
      },
    }));
    load.mockResolvedValueOnce({
      ok: true,
      value: { files: [second], total: 2, page: 2, pageSize: 1 },
    });
    const { result } = renderHook(() =>
      usePagedFiles("scope", load, {
        files: [first],
        total: 2,
        page: 1,
        pageSize: 1,
      }),
    );
    await act(async () => {
      await result.current.loadMore();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(result.current.files.map((file) => file.id)).toEqual([
      "first",
      "second",
    ]);
    expect(result.current.files.every((file) => !!file.thumbnailUrl)).toBe(
      true,
    );
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });
});
