"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PortalOnboardingErrorCode,
  type PortalOnboardingErrorCode as PortalOnboardingErrorCodeValue,
} from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import { portalOnboardingApiService } from "@/client/portal/portal-onboarding-api-service";
import { DraftSaveState } from "@/common/constants/shared/draft-save-states";
import { onboardingAnswerDrafts } from "@/common/patterns/portal/onboarding-answer-drafts";
import { DRAFT_AUTOSAVE_DELAY_MS } from "@/common/constants/shared/draft-autosave-delay";
import { useLeaveWarning } from "@/hooks/shared/use-leave-warning";

/**
 * Holds the answers of a form locally and saves them slot by slot: text debounced and when the
 * field is left, a selection at once. Saves run one after another, so the last write of a slot
 * wins. Text that fails its field's validation stays in the input and is never sent; a failed
 * save keeps the input as well and can be retried. A slot is a field on block level or a
 * sub-field within one group entry; every key here is an `onboardingAnswerDrafts.slotKey`.
 */
export function useOnboardingAutosave({
  customerId,
  form,
  leaveWarning,
  onLockedAction,
  waitForEntryAction,
}: {
  customerId: string;
  form: PortalOnboardingFormDto;
  leaveWarning: string;
  /**
   * Resolves once a group entry exists on the server. An entry is shown before its creation went
   * through, and a sub-field answer sent ahead of it would be refused. False drops the save.
   */
  waitForEntryAction?: (groupEntryId: string) => Promise<boolean>;
  /** The form left the editable state elsewhere (submitted by another contact); the page reloads. */
  onLockedAction: () => void;
}) {
  const fields = useMemo(
    () => onboardingAnswerDrafts.indexFields(form.blocks),
    [form.blocks],
  );
  const [drafts, setDrafts] = useState(() =>
    onboardingAnswerDrafts.fromAnswers(form.answers),
  );
  /** Slots with input that is neither saved nor on its way. */
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] =
    useState<PortalOnboardingErrorCodeValue | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(form.lastEditedAt);
  const [savedByName, setSavedByName] = useState<string | null>(
    form.lastEditedByName,
  );
  const [savedHere, setSavedHere] = useState(false);

  const draftsRef = useRef(drafts);
  const queueRef = useRef(new Set<string>());
  const failedRef = useRef(new Set<string>());
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const runningRef = useRef<Promise<void> | null>(null);
  const onLockedRef = useRef(onLockedAction);
  const waitForEntryRef = useRef(waitForEntryAction);

  useEffect(() => {
    onLockedRef.current = onLockedAction;
    waitForEntryRef.current = waitForEntryAction;
  });

  const syncPending = useCallback(() => {
    setPending(new Set([...timersRef.current.keys(), ...queueRef.current]));
  }, []);

  const saveField = useCallback(
    async (key: string) => {
      const { fieldId, groupEntryId } =
        onboardingAnswerDrafts.parseSlotKey(key);
      const field = fields.get(fieldId);
      if (!field) return;
      if (groupEntryId && !(await waitForEntryRef.current?.(groupEntryId)))
        return;
      // Read after the wait: what was typed meanwhile is part of this save.
      const entries = draftsRef.current.get(key);
      // Invalid text is never sent; the field shows why and the last saved value stays stored.
      if (!entries || onboardingAnswerDrafts.validate(field, entries)) return;
      const result = await portalOnboardingApiService.saveAnswer(
        customerId,
        form.id,
        onboardingAnswerDrafts.toRequest(field, entries, groupEntryId),
      );
      if (result.ok) {
        failedRef.current.delete(key);
        setSavedAt(result.value.savedAt);
        setSavedByName(result.value.savedByName);
        setSavedHere(true);
        if (failedRef.current.size === 0) setErrorCode(null);
      } else {
        failedRef.current.add(key);
        setErrorCode(result.code);
        if (
          result.code === PortalOnboardingErrorCode.Locked ||
          result.code === PortalOnboardingErrorCode.NotFound
        )
          onLockedRef.current();
      }
      setFailed(new Set(failedRef.current));
    },
    [customerId, fields, form.id],
  );

  /** Works the queue off one save at a time; an edit during a save is sent right after it. */
  const pump = useCallback((): Promise<void> => {
    if (runningRef.current) return runningRef.current;
    let finished = false;
    const running = (async () => {
      setSaving(true);
      for (;;) {
        const next = queueRef.current.values().next();
        if (next.done) break;
        queueRef.current.delete(next.value);
        syncPending();
        await saveField(next.value);
      }
      setSaving(false);
      // Cleared in the same tick as the empty check, so a later edit always starts a new run.
      finished = true;
      runningRef.current = null;
    })();
    if (!finished) runningRef.current = running;
    return running;
  }, [saveField, syncPending]);

  const enqueue = useCallback(
    (fieldId: string) => {
      const timer = timersRef.current.get(fieldId);
      if (timer) clearTimeout(timer);
      timersRef.current.delete(fieldId);
      queueRef.current.add(fieldId);
      syncPending();
      return pump();
    },
    [pump, syncPending],
  );

  /** `immediate` is for selections, where there is no typing to wait for. */
  const change = useCallback(
    (
      fieldId: string,
      entries: readonly string[],
      options: { immediate?: boolean } = {},
    ) => {
      const next = new Map(draftsRef.current);
      next.set(fieldId, [...entries]);
      draftsRef.current = next;
      setDrafts(next);
      if (options.immediate) {
        void enqueue(fieldId);
        return;
      }
      const timer = timersRef.current.get(fieldId);
      if (timer) clearTimeout(timer);
      timersRef.current.set(
        fieldId,
        setTimeout(() => void enqueue(fieldId), DRAFT_AUTOSAVE_DELAY_MS),
      );
      syncPending();
    },
    [enqueue, syncPending],
  );

  /** Leaving a field saves what was typed in it without waiting for the delay. */
  const commit = useCallback(
    (fieldId: string) => {
      if (timersRef.current.has(fieldId)) void enqueue(fieldId);
    },
    [enqueue],
  );

  const invalid = useMemo(
    () => onboardingAnswerDrafts.listInvalid(drafts, fields, form.blocks),
    [drafts, fields, form.blocks],
  );

  /**
   * Saves everything typed so far. Resolves false when something is not stored: a failed save or
   * text that does not pass its field's validation.
   */
  const flush = useCallback(async (): Promise<boolean> => {
    for (const fieldId of [...timersRef.current.keys()]) void enqueue(fieldId);
    await pump();
    const unsendable = onboardingAnswerDrafts.listInvalid(
      draftsRef.current,
      fields,
      form.blocks,
    ).size;
    return (
      unsendable === 0 &&
      failedRef.current.size === 0 &&
      queueRef.current.size === 0 &&
      timersRef.current.size === 0
    );
  }, [enqueue, fields, form.blocks, pump]);

  const retry = useCallback(() => {
    for (const fieldId of failedRef.current) queueRef.current.add(fieldId);
    syncPending();
    void pump();
  }, [pump, syncPending]);

  /** Forgets everything typed into a removed group entry; nothing of it is saved anymore. */
  const discardEntry = useCallback(
    (groupEntryId: string) => {
      const ofEntry = (key: string) =>
        onboardingAnswerDrafts.parseSlotKey(key).groupEntryId === groupEntryId;
      for (const [key, timer] of timersRef.current)
        if (ofEntry(key)) {
          clearTimeout(timer);
          timersRef.current.delete(key);
        }
      for (const key of [...queueRef.current])
        if (ofEntry(key)) queueRef.current.delete(key);
      for (const key of [...failedRef.current])
        if (ofEntry(key)) failedRef.current.delete(key);
      draftsRef.current = onboardingAnswerDrafts.dropEntry(
        draftsRef.current,
        groupEntryId,
      );
      setDrafts(draftsRef.current);
      setFailed(new Set(failedRef.current));
      syncPending();
    },
    [syncPending],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  const answers = useMemo(
    () => onboardingAnswerDrafts.toAnswers(drafts, fields),
    [drafts, fields],
  );

  let saveState: DraftSaveState = savedHere
    ? DraftSaveState.Saved
    : DraftSaveState.Idle;
  if (pending.size > 0 || invalid.size > 0) saveState = DraftSaveState.Unsaved;
  if (failed.size > 0) saveState = DraftSaveState.Failed;
  if (saving) saveState = DraftSaveState.Saving;

  useLeaveWarning(
    saveState === DraftSaveState.Unsaved ||
      saveState === DraftSaveState.Saving ||
      saveState === DraftSaveState.Failed,
    leaveWarning,
  );

  return {
    drafts,
    /** The drafts as answer rows, for visibility and completeness while typing. */
    answers,
    /** Slots whose text cannot be saved, with the reason. */
    invalid,
    saveState,
    errorCode,
    savedAt,
    savedByName,
    change,
    commit,
    discardEntry,
    flush,
    retry,
  };
}
