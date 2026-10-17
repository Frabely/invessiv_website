// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./use-media-query";

function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      addEventListener: (_: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) =>
        listeners.delete(listener),
    })),
  );
  return (next: boolean) => {
    matches = next;
    for (const listener of listeners) listener();
  };
}

describe("useMediaQuery", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("follows the viewport as the query starts and stops matching", () => {
    const change = stubMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1100px)"));
    expect(result.current).toBe(false);

    act(() => change(true));
    expect(result.current).toBe(true);
  });

  it("answers false without matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1100px)"));
    expect(result.current).toBe(false);
  });
});
