// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOptimisticChange } from "./use-optimistic-change";

type Item = { id: string; version: number; value: string };
const item: Item = { id: "one", version: 1, value: "open" };

describe("useOptimisticChange", () => {
  it("shows a pending value, prevents duplicate writes and adopts a new version", async () => {
    let complete!: (result: { ok: boolean }) => void;
    const submit = vi.fn(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          complete = resolve;
        }),
    );
    const onSettled = vi.fn();
    const { result } = renderHook(() =>
      useOptimisticChange<string, Item>({
        valueOf: (row) => row.value,
        submit,
        announce: { success: () => "Saved", failure: () => "Failed" },
        onSettled,
      }),
    );

    let first!: Promise<void>;
    act(() => {
      first = result.current.change(item, "done");
    });
    expect(result.current.valueOf(item)).toBe("done");
    expect(result.current.isPending(item.id)).toBe(true);
    await act(() => result.current.change(item, "done"));
    expect(submit).toHaveBeenCalledOnce();
    await act(async () => {
      complete({ ok: true });
      await first;
    });
    expect(result.current.announcement).toBe("Saved");
    expect(onSettled).toHaveBeenCalledOnce();
    expect(result.current.valueOf({ ...item, version: 2, value: "done" })).toBe(
      "done",
    );
  });

  it("rolls back a rejected update and announces the failure", async () => {
    const { result } = renderHook(() =>
      useOptimisticChange<string, Item>({
        valueOf: (row) => row.value,
        submit: async () => ({ ok: false }),
        announce: { success: () => "Saved", failure: () => "Failed" },
      }),
    );
    await act(() => result.current.change(item, "done"));
    expect(result.current.valueOf(item)).toBe("open");
    expect(result.current.announcement).toBe("Failed");
    expect(result.current.isPending(item.id)).toBe(false);
  });
});
