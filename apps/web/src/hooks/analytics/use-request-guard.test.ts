// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRequestGuard } from "./use-request-guard";

describe("request guard", () => {
  it("invalidates older requests and pending results after unmount", () => {
    const { result, unmount } = renderHook(() => useRequestGuard());
    const first = result.current();
    expect(first()).toBe(true);
    const second = result.current();
    expect(first()).toBe(false);
    expect(second()).toBe(true);
    act(() => unmount());
    expect(second()).toBe(false);
    expect(result.current()()).toBe(false);
  });
});
