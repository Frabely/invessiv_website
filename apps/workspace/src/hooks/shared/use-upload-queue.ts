"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_PARALLEL_UPLOADS } from "@invessiv/common/constants/files/upload-limits";
import { FileApiErrorCode } from "@invessiv/common/constants/files/file-api-error-code";
import { UploadQueueItemStatus as Status } from "@invessiv/common/constants/files/upload-queue-item-status";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { UploadQueueErrorCode } from "@invessiv/common/contracts/files/upload-queue-error-code";
import type { UploadQueueItem } from "@invessiv/common/contracts/files/upload-queue-item";
import { uploadQueuePlan } from "@invessiv/common/patterns/files/upload-queue-plan";
import { transferToStorage } from "@/client/shared/storage-transfer";
import type { UploadQueueTransport } from "@/common/contracts/files/upload-queue-transport";

/**
 * Runs one upload batch: the browser check on selection, at most three parallel transfers with
 * progress, cancel and retry per file, and a leave-page warning while anything is in flight.
 * A retry after a failed finalization resumes there instead of uploading the bytes again.
 */
export function useUploadQueue<TFile extends { id: string } = FileDto>(
  transport: UploadQueueTransport<TFile>,
  options: { onUploadedAction?: (file: TFile) => void } = {},
) {
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const controllersRef = useRef(new Map<string, AbortController>());
  const serverIdsRef = useRef(new Map<string, string>());
  const storedRef = useRef(new Set<string>());
  const runningRef = useRef(new Set<string>());
  const cancelRequestedRef = useRef(new Set<string>());
  const sequenceRef = useRef(0);
  const transportRef = useRef(transport);
  const onUploadedRef = useRef(options.onUploadedAction);

  useEffect(() => {
    transportRef.current = transport;
    onUploadedRef.current = options.onUploadedAction;
  });

  const patch = useCallback(
    (id: string, next: Partial<UploadQueueItem>) =>
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...next } : item)),
      ),
    [],
  );

  const fail = useCallback(
    (id: string, code: UploadQueueErrorCode) =>
      patch(id, {
        status: Status.Failed,
        errorCode: code,
        retryable: uploadQueuePlan.isRetryable(code),
      }),
    [patch],
  );

  const run = useCallback(
    async (id: string) => {
      const file = filesRef.current.get(id);
      if (!file) return;

      async function releasePending(): Promise<UploadQueueErrorCode | null> {
        const serverId = serverIdsRef.current.get(id);
        if (!serverId) return null;
        const cancelPending = transportRef.current.cancelPending;
        if (cancelPending) {
          const cancelled = await cancelPending(serverId);
          if (!cancelled.ok && cancelled.code !== FileApiErrorCode.NotFound)
            return cancelled.code;
        }
        serverIdsRef.current.delete(id);
        storedRef.current.delete(id);
        return null;
      }
      try {
        if (!storedRef.current.has(id)) {
          const previousCleanupError = await releasePending();
          if (previousCleanupError) return fail(id, previousCleanupError);
          const ticket = await transportRef.current.createTicket(file);
          if (!ticket.ok) {
            if (cancelRequestedRef.current.has(id))
              return patch(id, { status: Status.Cancelled, progress: 0 });
            return fail(id, ticket.code);
          }
          serverIdsRef.current.set(id, ticket.value.file.id);
          if (cancelRequestedRef.current.has(id)) {
            const cleanupError = await releasePending();
            return cleanupError
              ? fail(id, cleanupError)
              : patch(id, { status: Status.Cancelled, progress: 0 });
          }
          const controller = new AbortController();
          controllersRef.current.set(id, controller);
          const transfer = await transferToStorage(
            ticket.value.ticket,
            file,
            (progress) => patch(id, { progress }),
            controller.signal,
          );
          controllersRef.current.delete(id);
          if (!transfer.ok) {
            const cleanupError = await releasePending();
            if (cleanupError) return fail(id, cleanupError);
            if ("aborted" in transfer)
              return patch(id, { status: Status.Cancelled, progress: 0 });
            return fail(id, transfer.code);
          }
          storedRef.current.add(id);
        }
        patch(id, { status: Status.Finalizing, progress: 1 });
        const serverId = serverIdsRef.current.get(id);
        if (!serverId) return;
        const completed = await transportRef.current.complete(serverId);
        if (!completed.ok) {
          // Refused content is removed on the server; only a transient failure may resume.
          if (!uploadQueuePlan.isRetryable(completed.code))
            storedRef.current.delete(id);
          if (!uploadQueuePlan.isRetryable(completed.code))
            serverIdsRef.current.delete(id);
          return fail(id, completed.code);
        }
        patch(id, { status: Status.Done, errorCode: null });
        serverIdsRef.current.delete(id);
        onUploadedRef.current?.(completed.value);
      } finally {
        runningRef.current.delete(id);
      }
    },
    [fail, patch],
  );

  useEffect(() => {
    const active = items.filter(
      (item) =>
        item.status === Status.Uploading || item.status === Status.Finalizing,
    ).length;
    const next = items
      .filter(
        (item) =>
          item.status === Status.Queued && !runningRef.current.has(item.id),
      )
      .slice(0, Math.max(0, MAX_PARALLEL_UPLOADS - active));
    if (next.length === 0) return;
    for (const item of next) runningRef.current.add(item.id);
    setItems((current) =>
      current.map((item) =>
        next.some((started) => started.id === item.id)
          ? { ...item, status: Status.Uploading, errorCode: null }
          : item,
      ),
    );
    for (const item of next) void run(item.id);
  }, [items, run]);

  const isActive = items.some(
    (item) =>
      item.status === Status.Queued ||
      item.status === Status.Uploading ||
      item.status === Status.Finalizing,
  );

  useEffect(() => {
    if (!isActive) return;

    function warn(event: BeforeUnloadEvent) {
      // `preventDefault()` alone triggers the browser's leave-site prompt in current engines;
      // `returnValue` was the legacy way to do this and is now deprecated.
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isActive]);

  function stage(files: readonly File[]) {
    const kept = items.filter(
      (item) =>
        item.status !== Status.Rejected && item.status !== Status.Cancelled,
    );
    const plan = uploadQueuePlan.planSelection(files, {
      count: kept.length,
      bytes: kept.reduce((sum, item) => sum + item.size, 0),
    });
    const staged = files.map((file, index): UploadQueueItem => {
      sequenceRef.current += 1;
      const id = `upload-${sequenceRef.current}`;
      const result = plan[index];
      if (result.ok) filesRef.current.set(id, file);
      return {
        id,
        name: file.name,
        size: file.size,
        assetKind: result.ok ? result.assetKind : null,
        status: result.ok ? Status.Staged : Status.Rejected,
        progress: 0,
        errorCode: result.ok ? null : result.code,
        retryable: false,
      };
    });
    setItems((current) => [...current, ...staged]);
  }

  function start() {
    setItems((current) =>
      current.map((item) =>
        item.status === Status.Staged
          ? { ...item, status: Status.Queued }
          : item,
      ),
    );
  }

  function remove(id: string) {
    filesRef.current.delete(id);
    cancelRequestedRef.current.delete(id);
    setItems((current) =>
      current.filter(
        (item) =>
          item.id !== id ||
          (item.status !== Status.Staged && item.status !== Status.Rejected),
      ),
    );
  }

  function cancel(id: string) {
    cancelRequestedRef.current.add(id);
    const controller = controllersRef.current.get(id);
    if (controller) {
      controller.abort();
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.id === id &&
        !runningRef.current.has(id) &&
        (item.status === Status.Queued || item.status === Status.Staged)
          ? { ...item, status: Status.Cancelled }
          : item,
      ),
    );
  }

  function retry(id: string) {
    cancelRequestedRef.current.delete(id);
    setItems((current) =>
      current.map((item) =>
        item.id === id &&
        ((item.status === Status.Failed && item.retryable) ||
          item.status === Status.Cancelled)
          ? { ...item, status: Status.Queued, errorCode: null, progress: 0 }
          : item,
      ),
    );
  }

  function reset() {
    if (isActive) return;
    filesRef.current.clear();
    serverIdsRef.current.clear();
    storedRef.current.clear();
    cancelRequestedRef.current.clear();
    setItems([]);
  }

  return {
    items,
    isActive,
    hasStarted: items.some(
      (item) =>
        item.status !== Status.Staged && item.status !== Status.Rejected,
    ),
    stagedCount: items.filter((item) => item.status === Status.Staged).length,
    doneCount: items.filter((item) => item.status === Status.Done).length,
    stage,
    start,
    remove,
    cancel,
    retry,
    reset,
  };
}
