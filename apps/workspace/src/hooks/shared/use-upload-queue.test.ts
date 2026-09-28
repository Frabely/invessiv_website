// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import { UploadQueueItemStatus as Status } from "@invessiv/common/constants/files/upload-queue-item-status";
import { UploadTransferErrorCode } from "@invessiv/common/constants/files/upload-transfer-error-code";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { StorageTransferResult } from "@/common/contracts/files/storage-transfer-result";
import { useUploadQueue } from "./use-upload-queue";

const transfer = vi.hoisted(() => ({ transferToStorage: vi.fn() }));
vi.mock("@/client/shared/storage-transfer", () => ({
  transferToStorage: transfer.transferToStorage,
}));

function file(name: string, size = 10) {
  return new File(["x".repeat(size)], name);
}

function transport() {
  let sequence = 0;
  return {
    createTicket: vi.fn(async () => {
      sequence += 1;
      return {
        ok: true as const,
        value: {
          file: { id: `server-${sequence}` } as FileDto,
          ticket: { url: "https://store", method: "PUT" as const, headers: {} },
        },
      };
    }),
    complete: vi.fn(async (id: string) => ({
      ok: true as const,
      value: { id, displayName: id } as FileDto,
    })),
  };
}

function statuses(items: { status: string }[]) {
  return items.map((item) => item.status);
}

afterEach(() => {
  transfer.transferToStorage.mockReset();
});

describe("useUploadQueue", () => {
  it("refuses unsupported files on selection and never sends them", async () => {
    const api = transport();
    transfer.transferToStorage.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useUploadQueue(api));
    act(() => result.current.stage([file("a.exe"), file("b.pdf")]));
    expect(result.current.items[0]).toMatchObject({
      status: Status.Rejected,
      errorCode: FileErrorCode.UnsupportedExtension,
    });
    expect(result.current.stagedCount).toBe(1);
    act(() => result.current.start());
    await waitFor(() =>
      expect(statuses(result.current.items)).toEqual([
        Status.Rejected,
        Status.Done,
      ]),
    );
    expect(api.createTicket).toHaveBeenCalledTimes(1);
  });

  it("runs at most three transfers at once and reports every finished file", async () => {
    const api = transport();
    const pending: ((value: StorageTransferResult) => void)[] = [];
    transfer.transferToStorage.mockImplementation(
      () => new Promise((resolve) => pending.push(resolve)),
    );
    const onUploadedAction = vi.fn();
    const { result } = renderHook(() =>
      useUploadQueue(api, { onUploadedAction }),
    );
    act(() =>
      result.current.stage([
        file("1.png"),
        file("2.png"),
        file("3.png"),
        file("4.png"),
      ]),
    );
    act(() => result.current.start());
    await waitFor(() => expect(pending).toHaveLength(3));
    expect(result.current.isActive).toBe(true);
    await act(async () => pending[0]({ ok: true }));
    await waitFor(() => expect(pending).toHaveLength(4));
    await act(async () => {
      for (const resolve of pending.slice(1)) resolve({ ok: true });
    });
    await waitFor(() => expect(result.current.doneCount).toBe(4));
    expect(onUploadedAction).toHaveBeenCalledTimes(4);
    expect(result.current.isActive).toBe(false);
  });

  it("resumes at finalization after a transient failure instead of uploading again", async () => {
    const api = transport();
    transfer.transferToStorage.mockResolvedValue({ ok: true });
    api.complete.mockResolvedValueOnce({
      ok: false,
      code: FileApiErrorCode.StorageUnavailable,
    } as never);
    const { result } = renderHook(() => useUploadQueue(api));
    act(() => result.current.stage([file("a.pdf")]));
    act(() => result.current.start());
    await waitFor(() =>
      expect(result.current.items[0]).toMatchObject({
        status: Status.Failed,
        retryable: true,
      }),
    );
    act(() => result.current.retry(result.current.items[0].id));
    await waitFor(() =>
      expect(result.current.items[0].status).toBe(Status.Done),
    );
    expect(transfer.transferToStorage).toHaveBeenCalledTimes(1);
    expect(api.createTicket).toHaveBeenCalledTimes(1);
    expect(api.complete).toHaveBeenCalledTimes(2);
  });

  it("marks refused content as final and cancels a running transfer", async () => {
    const api = transport();
    transfer.transferToStorage.mockResolvedValueOnce({ ok: true });
    api.complete.mockResolvedValueOnce({
      ok: false,
      code: FileErrorCode.InvalidSignature,
    } as never);
    const { result } = renderHook(() => useUploadQueue(api));
    act(() => result.current.stage([file("fake.png")]));
    act(() => result.current.start());
    await waitFor(() =>
      expect(result.current.items[0]).toMatchObject({
        status: Status.Failed,
        errorCode: FileErrorCode.InvalidSignature,
        retryable: false,
      }),
    );

    transfer.transferToStorage.mockImplementationOnce(
      (_ticket, _file, _progress, signal: AbortSignal) =>
        new Promise((resolve) =>
          signal.addEventListener("abort", () =>
            resolve({ ok: false, aborted: true }),
          ),
        ),
    );
    act(() => result.current.stage([file("b.png")]));
    act(() => result.current.start());
    await waitFor(() =>
      expect(result.current.items[1].status).toBe(Status.Uploading),
    );
    await waitFor(() =>
      expect(transfer.transferToStorage).toHaveBeenCalledTimes(2),
    );
    act(() => result.current.cancel(result.current.items[1].id));
    await waitFor(() =>
      expect(result.current.items[1].status).toBe(Status.Cancelled),
    );
  });

  it("warns before leaving while uploads run and treats network errors as retryable", async () => {
    const api = transport();
    let finish: (value: StorageTransferResult) => void = () => undefined;
    transfer.transferToStorage.mockImplementation(
      () => new Promise((resolve) => (finish = resolve)),
    );
    const { result } = renderHook(() => useUploadQueue(api));
    act(() => result.current.stage([file("a.mp4")]));
    act(() => result.current.start());
    await waitFor(() => expect(transfer.transferToStorage).toHaveBeenCalled());
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    await act(async () =>
      finish({ ok: false, code: UploadTransferErrorCode.Network }),
    );
    await waitFor(() =>
      expect(result.current.items[0]).toMatchObject({
        status: Status.Failed,
        retryable: true,
      }),
    );
    const after = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });
});
