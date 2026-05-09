// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useWorkspaceSidebarDrawer } from "./use-workspace-sidebar-drawer";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    writable: true,
    value,
  });
}

describe("useWorkspaceSidebarDrawer", () => {
  beforeEach(() => {
    setScrollY(0);
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.body.removeAttribute("style");
    vi.restoreAllMocks();
  });

  it("starts closed", () => {
    const { result } = renderHook(() => useWorkspaceSidebarDrawer());

    expect(result.current.isOpen).toBe(false);
  });

  it("opens, closes, and toggles", () => {
    const { result } = renderHook(() => useWorkspaceSidebarDrawer());

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it("closes on Escape only when open", () => {
    const { result } = renderHook(() => useWorkspaceSidebarDrawer());

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("ignores non-Escape keys when open", () => {
    const { result } = renderHook(() => useWorkspaceSidebarDrawer());

    act(() => result.current.open());
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("locks body scroll while open and restores it on close", () => {
    setScrollY(240);
    const scrollToSpy = vi.spyOn(window, "scrollTo");

    const { result } = renderHook(() => useWorkspaceSidebarDrawer());

    act(() => result.current.open());

    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-240px");
    expect(document.body.style.width).toBe("100%");
    expect(document.body.style.overflow).toBe("hidden");

    act(() => result.current.close());

    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(document.body.style.width).toBe("");
    expect(document.body.style.overflow).toBe("");
    expect(scrollToSpy).toHaveBeenCalledWith(0, 240);
  });

  it("restores body styles when unmounted while open", () => {
    setScrollY(120);

    const { result, unmount } = renderHook(() => useWorkspaceSidebarDrawer());

    act(() => result.current.open());
    expect(document.body.style.position).toBe("fixed");

    unmount();

    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(document.body.style.width).toBe("");
    expect(document.body.style.overflow).toBe("");
  });

  it("removes the keydown listener after closing", () => {
    const { result } = renderHook(() => useWorkspaceSidebarDrawer());

    act(() => result.current.open());
    act(() => result.current.close());

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.isOpen).toBe(false);
  });
});
