// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { useVersionedMutation } from "./use-versioned-mutation";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

type Entity = { id: string; version: number };

describe("useVersionedMutation", () => {
  beforeEach(() => {
    refresh.mockReset();
  });

  it("refreshes and calls the success action after a successful write", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useVersionedMutation<Entity, "NOT_FOUND">(
        { id: "a", version: 1 },
        onSuccess,
      ),
    );

    await act(() => result.current.submit(async () => ({ ok: true })));

    expect(refresh).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it("adopts the current state on a conflict and passes it to the retry", async () => {
    const mutate = vi.fn().mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: { id: "a", version: 4 },
    });
    const { result } = renderHook(() =>
      useVersionedMutation<Entity, "NOT_FOUND">(
        { id: "a", version: 1 },
        vi.fn(),
      ),
    );

    await act(() => result.current.submit(mutate));

    expect(result.current.hasConflict).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.current).toEqual({ id: "a", version: 4 });

    mutate.mockResolvedValueOnce({ ok: false, code: "NOT_FOUND" });
    await act(() => result.current.submit(mutate));

    expect(mutate).toHaveBeenLastCalledWith({ id: "a", version: 4 });
    expect(result.current.hasConflict).toBe(false);
    expect(result.current.errorCode).toBe("NOT_FOUND");
  });

  it("finishes conflict recovery before allowing a retry", async () => {
    const onConflict = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useVersionedMutation<Entity, "NOT_FOUND">(
        { id: "a", version: 1 },
        vi.fn(),
        { onConflictAction: onConflict },
      ),
    );

    await act(() =>
      result.current.submit(async () => ({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: { id: "a", version: 2 },
      })),
    );

    expect(onConflict).toHaveBeenCalledOnce();
    expect(onConflict).toHaveBeenCalledWith({ id: "a", version: 2 });
    expect(result.current.hasConflict).toBe(true);
  });

  it("refreshes stale background data when a conflicted dialog is closed", async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useVersionedMutation<Entity, "NOT_FOUND">(
        { id: "a", version: 1 },
        onClose,
      ),
    );

    await act(() =>
      result.current.submit(async () => ({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: { id: "a", version: 2 },
      })),
    );
    act(() => result.current.close());

    expect(refresh).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not refresh an untouched dialog when it is closed", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useVersionedMutation<Entity, "NOT_FOUND">(
        { id: "a", version: 1 },
        onClose,
      ),
    );

    act(() => result.current.close());

    expect(refresh).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
