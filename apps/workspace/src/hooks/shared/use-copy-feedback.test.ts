// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyFeedbackStatus } from "@/common/constants/credentials/copy-feedback-status";
import { useCopyFeedback } from "./use-copy-feedback";

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useCopyFeedback", () => {
  it("shows copied for a moment and returns to idle", async () => {
    const { result } = renderHook(() => useCopyFeedback());

    await act(async () => result.current.copy("login"));
    expect(writeText).toHaveBeenCalledExactlyOnceWith("login");
    expect(result.current.status).toBe(CopyFeedbackStatus.Copied);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.status).toBe(CopyFeedbackStatus.Idle);
  });

  it("reports a refused clipboard", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const { result } = renderHook(() => useCopyFeedback());

    await act(async () => result.current.copy("login"));
    expect(result.current.status).toBe(CopyFeedbackStatus.Failed);
  });
});
