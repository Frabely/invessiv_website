// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import { useVersionedCommand } from "./use-versioned-command";

describe("useVersionedCommand", () => {
  it("is busy while the call runs and sorts its answer", async () => {
    const { result } = renderHook(() => useVersionedCommand());
    let release: (value: { ok: true; value: number }) => void = () => {};
    const pending = new Promise<{ ok: true; value: number }>((resolve) => {
      release = resolve;
    });

    let outcome: Promise<unknown> = Promise.resolve();
    act(() => {
      outcome = result.current.run(() => pending);
    });
    expect(result.current.busy).toBe(true);

    await act(async () => {
      release({ ok: true, value: 7 });
      await outcome;
    });

    expect(result.current.busy).toBe(false);
    await expect(outcome).resolves.toEqual({
      kind: VersionedMutationOutcomeKind.Saved,
      value: 7,
    });
  });

  it("is not busy any more when the call throws", async () => {
    const { result } = renderHook(() => useVersionedCommand());

    await act(async () => {
      await expect(
        result.current.run(() => Promise.reject(new Error("network down"))),
      ).rejects.toThrow("network down");
    });

    expect(result.current.busy).toBe(false);
  });
});
