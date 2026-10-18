// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFileSelection } from "./use-file-selection";
import { useUrlHistoryGuard, useUrlSearch } from "./use-url-search";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("useUrlSearch", () => {
  it.each(["__NA", "_N"])(
    "synchronizes Next's URL on replace despite its existing %s marker",
    (marker) => {
      window.history.replaceState(
        { [marker]: true, opaque: "caller-metadata", __invessivUrlIndex: 7 },
        "",
        "/files?project=one#files",
      );
      const nativeReplace = window.history.replaceState.bind(window.history);
      let routerSearch = window.location.search;
      // Next's wrapper ignores writes carrying its internal markers, then copies them back.
      vi.spyOn(window.history, "replaceState").mockImplementation(
        (state, unused, url) => {
          if (!state?.__NA && !state?._N && url)
            routerSearch = new URL(url, window.location.href).search;
          nativeReplace({ ...state, [marker]: true }, unused, url);
        },
      );
      const { result } = renderHook(() => useUrlSearch());
      const historyLength = window.history.length;
      act(() =>
        result.current.replace((params) => params.set("project", "two")),
      );
      expect(routerSearch).toBe("?project=two");
      expect(result.current.search).toBe("project=two");
      expect(window.location.hash).toBe("#files");
      expect(window.history.length).toBe(historyLength);
      expect(window.history.state).toMatchObject({
        __invessivUrlIndex: 7,
        [marker]: true,
      });
      expect(window.history.state).not.toHaveProperty("opaque");
    },
  );

  it("shares query writes with file selection without losing unrelated params or the hash", () => {
    window.history.replaceState(
      { opaque: "router-state" },
      "",
      "/files?project=project-1&tab=shared#files",
    );
    const { result } = renderHook(() => ({
      url: useUrlSearch(),
      first: useFileSelection("customer-1", "selected"),
      second: useFileSelection("customer-1", "selected"),
      otherCustomer: useFileSelection("customer-2", "selected"),
    }));
    const length = window.history.length;
    act(() => result.current.first.add(["file-1", "file-1", "file-2"]));
    expect(result.current.second.selectedIds).toEqual(["file-1", "file-2"]);
    expect(result.current.otherCustomer.selectedIds).toEqual([]);
    act(() =>
      result.current.url.replace((params) => params.set("tab", "received")),
    );
    expect(result.current.first.selectedIds).toEqual(["file-1", "file-2"]);
    expect(new URLSearchParams(result.current.url.search).get("tab")).toBe(
      "received",
    );
    expect(new URLSearchParams(result.current.url.search).get("project")).toBe(
      "project-1",
    );
    expect(window.location.hash).toBe("#files");
    expect(window.history.state).toEqual({ __invessivUrlIndex: 0 });
    expect(window.history.length).toBe(length);
  });

  it("notifies every subscriber on native back and forward navigation", async () => {
    window.history.replaceState(null, "", "/files?tab=shared");
    const { result } = renderHook(() => ({
      a: useUrlSearch(),
      b: useUrlSearch(),
    }));
    act(() => result.current.a.push((params) => params.set("tab", "received")));
    expect(result.current.b.search).toBe("tab=received");
    act(() => window.history.back());
    await waitFor(() => expect(result.current.b.search).toBe("tab=shared"));
    act(() => window.history.forward());
    await waitFor(() => expect(result.current.a.search).toBe("tab=received"));
  });

  it("rolls back an unknown history entry without guessing its direction", () => {
    const warning = () => "Unsaved data";
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { result } = renderHook(() => {
      const url = useUrlSearch();
      useUrlHistoryGuard(warning);
      return url;
    });
    const original = window.location.href;
    act(() => {
      window.history.replaceState(null, "", "/another-page");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(confirm).toHaveBeenCalledOnce();
    expect(window.location.href).toBe(original);
    expect(result.current.search).toBe("");
    confirm.mockReturnValue(true);
    act(() => result.current.replace((params) => params.set("usable", "yes")));
    expect(result.current.search).toBe("usable=yes");
  });

  it("disconnects history guards and subscriptions on unmount", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const warning = () => "Unsaved data";
    const { result, unmount } = renderHook(() => {
      const url = useUrlSearch();
      useUrlHistoryGuard(warning);
      return url;
    });
    act(() => result.current.push((params) => params.set("step", "two")));
    unmount();
    act(() => window.history.back());
    await waitFor(() => expect(window.location.search).toBe(""));
    expect(confirm).not.toHaveBeenCalled();
  });
});
