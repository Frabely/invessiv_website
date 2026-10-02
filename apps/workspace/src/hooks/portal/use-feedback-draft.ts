"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import {
  PortalFeedbackErrorCode,
  type PortalFeedbackErrorCode as PortalFeedbackErrorCodeValue,
} from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { portalFeedbackApiService } from "@/client/portal/portal-feedback-api-service";
import {
  DraftSaveState,
  type DraftSaveState as DraftSaveStateValue,
} from "@/common/constants/shared/draft-save-states";
import type { FeedbackDraftItem } from "@/common/contracts/portal/feedback-draft-item";
import { feedbackDraftItems } from "@/common/patterns/portal/feedback-draft-items";
import { useLeaveWarning } from "@/hooks/shared/use-leave-warning";

// Long enough to not save on every keystroke, short enough that a reload rarely loses anything.
const AUTOSAVE_DELAY_MS = 1_500;

type DraftItemPatch = Partial<Omit<FeedbackDraftItem, "id" | "attachments">>;

/**
 * Holds the items of an open round locally and saves them debounced as a whole draft. Saves run one
 * after another, each with the version of the previous answer. A parallel save of another contact
 * answers 409: the sheet then shows the current draft and keeps the own unsaved items for restoring,
 * never overwriting either side silently.
 */
export function useFeedbackDraft({
  customerId,
  round,
  leaveWarning,
  onLockedAction,
}: {
  customerId: string;
  round: PortalFeedbackRoundDto;
  leaveWarning: string;
  /** The round left `open` elsewhere (submitted by another contact); the page reloads. */
  onLockedAction: () => void;
}) {
  const [items, setItems] = useState<FeedbackDraftItem[]>(() =>
    feedbackDraftItems.fromRound(round),
  );
  const [saveState, setSaveState] = useState<DraftSaveStateValue>(
    DraftSaveState.Idle,
  );
  const [errorCode, setErrorCode] =
    useState<PortalFeedbackErrorCodeValue | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(round.draftUpdatedAt);
  const [savedByName, setSavedByName] = useState<string | null>(
    round.draftUpdatedByName,
  );
  const [conflictItems, setConflictItems] = useState<
    FeedbackDraftItem[] | null
  >(null);

  const itemsRef = useRef(items);
  const versionRef = useRef(round.version);
  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const flushPromiseRef = useRef<Promise<boolean> | null>(null);
  const conflictPendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLockedRef = useRef(onLockedAction);
  const flushRef = useRef<() => Promise<boolean>>(async () => true);

  useEffect(() => {
    onLockedRef.current = onLockedAction;
  });

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  /** Server state replaces the local one; nothing counts as unsaved afterwards. */
  const adopt = useCallback((next: FeedbackDraftItem[]) => {
    itemsRef.current = next;
    setItems(next);
    revisionRef.current += 1;
    savedRevisionRef.current = revisionRef.current;
  }, []);

  /** Shows the draft another contact saved and keeps the own items for restoring. */
  const takeConflict = useCallback(
    (current: PortalFeedbackRoundDto) => {
      conflictPendingRef.current = true;
      versionRef.current = current.version;
      // Only what was typed since the last successful save is at risk.
      setConflictItems(itemsRef.current);
      adopt(feedbackDraftItems.fromRound(current));
      setSavedAt(current.draftUpdatedAt);
      setSavedByName(current.draftUpdatedByName);
      setSaveState(DraftSaveState.Conflict);
      if (current.status !== FeedbackRoundStatus.Open) onLockedRef.current();
    },
    [adopt],
  );

  const saveOnce = useCallback(async (): Promise<boolean> => {
    const revision = revisionRef.current;
    const snapshot = itemsRef.current;
    setSaveState(DraftSaveState.Saving);
    const result = await portalFeedbackApiService.saveDraft(
      customerId,
      round.id,
      {
        version: versionRef.current,
        items: feedbackDraftItems.toRequestItems(snapshot),
      },
    );
    if (result.ok) {
      versionRef.current = result.round.version;
      savedRevisionRef.current = revision;
      setSavedAt(result.round.draftUpdatedAt);
      setSavedByName(result.round.draftUpdatedByName);
      setErrorCode(null);
      setSaveState(
        revisionRef.current === revision
          ? DraftSaveState.Saved
          : DraftSaveState.Unsaved,
      );
      return true;
    }
    if (result.code === ConcurrencyErrorCode.VersionConflict) {
      takeConflict(result.current);
      return false;
    }
    setErrorCode(result.code);
    setSaveState(DraftSaveState.Failed);
    if (
      result.code === PortalFeedbackErrorCode.Locked ||
      result.code === PortalFeedbackErrorCode.NotFound
    )
      onLockedRef.current();
    return false;
  }, [customerId, round.id, takeConflict]);

  /** Saves everything typed so far; resolves false when the draft could not be saved. */
  const flush = useCallback((): Promise<boolean> => {
    clearTimer();
    if (flushPromiseRef.current) return flushPromiseRef.current;
    if (conflictPendingRef.current) return Promise.resolve(false);

    const pending = (async () => {
      // Edits made while a save ran need one more save; two passes usually catch up.
      for (let pass = 0; pass < 2; pass += 1) {
        if (conflictPendingRef.current) return false;
        if (revisionRef.current === savedRevisionRef.current) return true;
        const running = saveOnce();
        const saved = await running;
        if (!saved || conflictPendingRef.current) return false;
      }
      return revisionRef.current === savedRevisionRef.current;
    })();
    flushPromiseRef.current = pending;
    void pending.finally(() => {
      if (flushPromiseRef.current === pending) flushPromiseRef.current = null;
    });
    return pending;
  }, [saveOnce]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const commit = useCallback(
    (update: (current: FeedbackDraftItem[]) => FeedbackDraftItem[]) => {
      const next = update(itemsRef.current);
      itemsRef.current = next;
      setItems(next);
      revisionRef.current += 1;
      setSaveState(DraftSaveState.Unsaved);
      clearTimer();
      timerRef.current = setTimeout(() => {
        void flushRef.current();
      }, AUTOSAVE_DELAY_MS);
    },
    [],
  );

  useEffect(() => clearTimer, []);

  const hasUnsaved =
    saveState === DraftSaveState.Unsaved ||
    saveState === DraftSaveState.Saving ||
    saveState === DraftSaveState.Failed ||
    conflictItems !== null;

  useLeaveWarning(hasUnsaved, leaveWarning);

  function addItem() {
    commit((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        areaLabel: null,
        kind: null,
        body: "",
        attachments: [],
      },
    ]);
  }

  function updateItem(id: string, patch: DraftItemPatch) {
    commit((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(id: string) {
    commit((current) => current.filter((item) => item.id !== id));
  }

  /** Files change through their own endpoint; the draft itself stays saved. */
  function setAttachments(
    itemId: string,
    update: (current: FileAttachmentDto[]) => FileAttachmentDto[],
  ) {
    const next = itemsRef.current.map((item) =>
      item.id === itemId
        ? { ...item, attachments: update(item.attachments) }
        : item,
    );
    itemsRef.current = next;
    setItems(next);
  }

  /** Puts the own items back over the current draft and saves them with the fresh version. */
  function restoreConflict() {
    if (!conflictItems) return;
    const current = itemsRef.current;
    const attachments = new Map(
      current.map((item) => [item.id, item.attachments]),
    );
    setConflictItems(null);
    conflictPendingRef.current = false;
    commit(() =>
      conflictItems.map((item) => ({
        ...item,
        attachments: attachments.get(item.id) ?? [],
      })),
    );
    void flushRef.current();
  }

  function dismissConflict() {
    setConflictItems(null);
    conflictPendingRef.current = false;
    if (revisionRef.current === savedRevisionRef.current) {
      setSaveState(DraftSaveState.Saved);
    } else {
      setSaveState(DraftSaveState.Unsaved);
      void flushRef.current();
    }
  }

  return {
    items,
    saveState,
    errorCode,
    savedAt,
    savedByName,
    conflictItems,
    /** Version the next submit or approval has to send; valid after `flush()` resolved true. */
    currentVersion: () => versionRef.current,
    /** A submit or approval with a stale version ends up in the same conflict view. */
    takeConflict,
    addItem,
    updateItem,
    removeItem,
    setAttachments,
    flush,
    restoreConflict,
    dismissConflict,
  };
}
