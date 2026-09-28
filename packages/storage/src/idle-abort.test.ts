import { afterEach, describe, expect, it, vi } from "vitest";
import { createIdleAbort } from "./idle-abort";

afterEach(() => {
  vi.useRealTimers();
});

describe("createIdleAbort", () => {
  it("does not abort a slow-but-progressing operation, even past the timeout in total duration", async () => {
    vi.useFakeTimers();
    const idle = createIdleAbort(30_000);
    // Ten rounds of 12s each: 120s total, four times the timeout, but every
    // gap between keepAlive() calls stays under it.
    for (let round = 0; round < 10; round++) {
      await vi.advanceTimersByTimeAsync(12_000);
      expect(idle.signal.aborted).toBe(false);
      idle.keepAlive();
    }
    idle.dispose();
  });

  it("aborts after real inactivity", async () => {
    vi.useFakeTimers();
    const idle = createIdleAbort(30_000);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(idle.signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(idle.signal.aborted).toBe(true);
  });

  it("does not abort late once disposed", async () => {
    vi.useFakeTimers();
    const idle = createIdleAbort(30_000);
    idle.dispose();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(idle.signal.aborted).toBe(false);
  });
});
