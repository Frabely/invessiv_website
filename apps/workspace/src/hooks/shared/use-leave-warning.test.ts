// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLeaveWarning } from "./use-leave-warning";

function clickLink(attributes: Record<string, string> = {}) {
  const anchor = document.createElement("a");
  anchor.href = "#elsewhere";
  for (const [name, value] of Object.entries(attributes))
    anchor.setAttribute(name, value);
  document.body.append(anchor);
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  anchor.dispatchEvent(event);
  anchor.remove();
  return event;
}

describe("useLeaveWarning", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("asks before a link click while something is unsaved and blocks a declined one", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderHook(() => useLeaveWarning(true, "Leave?"));

    const event = clickLink();

    expect(confirm).toHaveBeenCalledWith("Leave?");
    expect(event.defaultPrevented).toBe(true);
  });

  it("lets a confirmed link click through", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderHook(() => useLeaveWarning(true, "Leave?"));

    expect(clickLink().defaultPrevented).toBe(false);
  });

  it("ignores links that open elsewhere", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderHook(() => useLeaveWarning(true, "Leave?"));

    clickLink({ target: "_blank" });

    expect(confirm).not.toHaveBeenCalled();
  });

  it("warns on unload only while something is unsaved", () => {
    const { rerender } = renderHook(
      ({ unsaved }) => useLeaveWarning(unsaved, "Leave?"),
      { initialProps: { unsaved: true } },
    );
    const first = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);

    rerender({ unsaved: false });
    const second = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
  });

  it("stays silent when nothing is unsaved", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderHook(() => useLeaveWarning(false, "Leave?"));

    expect(clickLink().defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });
});
