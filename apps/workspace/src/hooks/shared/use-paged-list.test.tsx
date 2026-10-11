// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePagedList } from "./use-paged-list";
import { usePagedFiles } from "./use-paged-files";

afterEach(cleanup);

describe("usePagedList", () => {
  it("ignores an old first page after the request changes", async () => {
    let resolveOld!: (page: {
      entries: string[];
      nextPage: number | null;
      metadata: undefined;
    }) => void;
    const old = new Promise<{
      entries: string[];
      nextPage: number | null;
      metadata: undefined;
    }>((resolve) => {
      resolveOld = resolve;
    });
    const { result, rerender } = renderHook(
      ({ key }) =>
        usePagedList<string, number>(key, 1, async () =>
          key === "old"
            ? old
            : { entries: ["new"], nextPage: null, metadata: undefined },
        ),
      { initialProps: { key: "old" } },
    );
    await act(async () => {});
    rerender({ key: "new" });
    expect(result.current.page).toBeNull();
    await waitFor(() => expect(result.current.page?.entries).toEqual(["new"]));
    await act(async () =>
      resolveOld({ entries: ["old"], nextPage: null, metadata: undefined }),
    );
    expect(result.current.page?.entries).toEqual(["new"]);
  });

  it("keeps existing entries on a rejected next page and permits retry", async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({
        entries: ["first"],
        nextPage: 2,
        metadata: undefined,
      })
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        entries: ["second"],
        nextPage: null,
        metadata: undefined,
      });
    const { result } = renderHook(() =>
      usePagedList<string, number>("list", 1, load),
    );
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    await act(async () => expect(await result.current.loadMore()).toBeNull());
    expect(result.current.loadingMore).toBe(false);
    expect(result.current.page?.entries).toEqual(["first"]);
    await act(async () => expect(await result.current.loadMore()).toBe(1));
    expect(result.current.page?.entries).toEqual(["first", "second"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("deduplicates concurrent next-page requests and discards stale results", async () => {
    let resolveMore!: (page: {
      entries: string[];
      nextPage: number | null;
      metadata: undefined;
    }) => void;
    const pending = new Promise<{
      entries: string[];
      nextPage: number | null;
      metadata: undefined;
    }>((resolve) => {
      resolveMore = resolve;
    });
    const load = vi.fn(async (position: number) =>
      position === 1
        ? { entries: ["first"], nextPage: 2, metadata: undefined }
        : pending,
    );
    const { result, rerender } = renderHook(
      ({ key }) => usePagedList<string, number>(key, 1, load),
      { initialProps: { key: "old" } },
    );
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    let request!: Promise<number | null>;
    act(() => {
      request = result.current.loadMore();
    });
    await act(async () => expect(await result.current.loadMore()).toBe(0));
    expect(load).toHaveBeenCalledTimes(2);
    rerender({ key: "new" });
    expect(result.current.loadingMore).toBe(false);
    await waitFor(() =>
      expect(result.current.page?.entries).toEqual(["first"]),
    );
    await act(async () => {
      resolveMore({ entries: ["stale"], nextPage: null, metadata: undefined });
      expect(await request).toBe(0);
    });
    expect(result.current.page?.entries).toEqual(["first"]);
  });

  it("reloads after a rejected first page", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        entries: ["success"],
        nextPage: null,
        metadata: undefined,
      });
    const { result } = renderHook(() =>
      usePagedList<string, number>("list", 1, load),
    );
    await waitFor(() => expect(result.current.failed).toBe(true));
    act(() => result.current.reload());
    await waitFor(() =>
      expect(result.current.page?.entries).toEqual(["success"]),
    );
    expect(result.current.failed).toBe(false);
  });
});

describe("usePagedFiles", () => {
  it("uses initial data, appends numbered pages and replaces files locally", async () => {
    const load = vi.fn().mockResolvedValue({
      ok: true,
      value: { files: [{ id: "b" }], total: 2, page: 2, pageSize: 1 },
    });
    const { result } = renderHook(() =>
      usePagedFiles("files", load, {
        files: [{ id: "a" }],
        total: 2,
        page: 1,
        pageSize: 1,
      }),
    );
    expect(load).not.toHaveBeenCalled();
    expect(result.current.total).toBe(2);
    await act(async () => {
      await result.current.loadMore();
    });
    expect(load).toHaveBeenCalledWith(2);
    expect(result.current.files).toEqual([{ id: "a" }, { id: "b" }]);
    expect(result.current.hasMore).toBe(false);
    const replacement = { id: "a" };
    act(() => result.current.replace(replacement));
    expect(result.current.files[0]).toBe(replacement);
    act(() => result.current.reload());
    await waitFor(() => expect(load).toHaveBeenCalledWith(1));
  });
});
