"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PortalOnboardingErrorCode,
  type PortalOnboardingErrorCode as PortalOnboardingErrorCodeValue,
} from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import { portalOnboardingApiService } from "@/client/portal/portal-onboarding-api-service";
import { useLeaveWarning } from "@/hooks/shared/use-leave-warning";

/** Key under which a failed confirmation of the booked services is reported. */
const SERVICES_ERROR_KEY = "services";

function byPosition(
  left: QuestionnaireGroupEntryDto,
  right: QuestionnaireGroupEntryDto,
) {
  return left.position - right.position;
}

/**
 * What a form holds besides its answers while it is filled in: group entries, attached files and
 * the confirmation of the booked services. Group commands run one after another, so the order the
 * server answers with is always the one on screen. A failure is reported under the field it
 * belongs to, where the customer is looking.
 */
export function useOnboardingFormState({
  customerId,
  form,
  leaveWarning,
  onLockedAction,
}: {
  customerId: string;
  form: PortalOnboardingFormDto;
  leaveWarning: string;
  /** The form left the editable state elsewhere; the page reloads. */
  onLockedAction: () => void;
}) {
  const [groupEntries, setGroupEntries] = useState(() =>
    [...form.groupEntries].sort(byPosition),
  );
  const [answerFiles, setAnswerFiles] = useState(form.answerFiles);
  const [servicesConfirmed, setServicesConfirmed] = useState(
    form.servicesConfirmed,
  );
  const [servicesNote, setServicesNote] = useState(form.servicesNote);
  const [errors, setErrors] = useState<
    ReadonlyMap<string, PortalOnboardingErrorCodeValue>
  >(new Map());
  const [inFlight, setInFlight] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const entriesRef = useRef(groupEntries);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const creatingRef = useRef(new Map<string, Promise<boolean>>());
  const runningRef = useRef(new Set<Promise<unknown>>());
  const onLockedRef = useRef(onLockedAction);

  useEffect(() => {
    onLockedRef.current = onLockedAction;
  });

  const writeEntries = useCallback(
    (
      update: (
        current: QuestionnaireGroupEntryDto[],
      ) => QuestionnaireGroupEntryDto[],
    ) => {
      entriesRef.current = update(entriesRef.current);
      setGroupEntries(entriesRef.current);
    },
    [],
  );

  const report = useCallback(
    (key: string, code: PortalOnboardingErrorCodeValue | null) => {
      setErrors((current) => {
        const next = new Map(current);
        if (code) next.set(key, code);
        else next.delete(key);
        return next;
      });
      if (
        code === PortalOnboardingErrorCode.Locked ||
        code === PortalOnboardingErrorCode.NotFound
      )
        onLockedRef.current();
    },
    [],
  );

  /** Counts the request as in flight and files its outcome under `key`. */
  const track = useCallback(
    <T>(
      key: string,
      request: () => Promise<PortalOnboardingResult<T>>,
    ): Promise<PortalOnboardingResult<T>> => {
      setInFlight((count) => count + 1);
      const running = request().then((result) => {
        report(key, result.ok ? null : result.code);
        if (result.ok) setSavedAt(new Date().toISOString());
        return result;
      });
      runningRef.current.add(running);
      void running.finally(() => {
        runningRef.current.delete(running);
        setInFlight((count) => count - 1);
      });
      return running;
    },
    [report],
  );

  /** Group commands of a form run strictly one after another. */
  const inOrder = useCallback(
    <T>(
      key: string,
      request: () => Promise<PortalOnboardingResult<T>>,
    ): Promise<PortalOnboardingResult<T>> => {
      const next = queueRef.current.then(() => track(key, request));
      queueRef.current = next.catch(() => undefined);
      return next;
    },
    [track],
  );

  /**
   * Entries added here but not yet answered by the server stay on screen behind the server's list;
   * otherwise an earlier answer would drop them together with the fields being filled in.
   */
  const replaceGroup = useCallback(
    (fieldId: string, entries: readonly QuestionnaireGroupEntryDto[]) =>
      writeEntries((current) => {
        const confirmed = [...entries].sort(byPosition);
        const known = new Set(confirmed.map((entry) => entry.id));
        const pending = current
          .filter(
            (entry) =>
              entry.fieldId === fieldId &&
              !known.has(entry.id) &&
              creatingRef.current.has(entry.id),
          )
          .sort(byPosition)
          .map((entry, index) => ({
            ...entry,
            position: confirmed.length + index,
          }));
        return [
          ...current.filter((entry) => entry.fieldId !== fieldId),
          ...confirmed,
          ...pending,
        ];
      }),
    [writeEntries],
  );

  /**
   * Shows the entry at once under an id made here, so its fields can be filled in right away. A
   * refused entry disappears again. Returns the id, for the focus.
   */
  const addEntry = useCallback(
    (fieldId: string): string => {
      const id = crypto.randomUUID();
      writeEntries((current) => [
        ...current,
        {
          id,
          fieldId,
          position: current.filter((entry) => entry.fieldId === fieldId).length,
        },
      ]);
      const created = inOrder(fieldId, () =>
        portalOnboardingApiService.addGroupEntry(customerId, form.id, {
          id,
          fieldId,
        }),
      ).then((result) => {
        if (result.ok) replaceGroup(fieldId, result.value);
        else writeEntries((current) => current.filter((e) => e.id !== id));
        creatingRef.current.delete(id);
        return result.ok;
      });
      creatingRef.current.set(id, created);
      return id;
    },
    [customerId, form.id, inOrder, replaceGroup, writeEntries],
  );

  /** Resolves once the entry exists on the server; false when it was refused. */
  const whenEntryReady = useCallback(
    (entryId: string): Promise<boolean> =>
      creatingRef.current.get(entryId) ?? Promise.resolve(true),
    [],
  );

  const removeEntry = useCallback(
    async (entry: QuestionnaireGroupEntryDto): Promise<boolean> => {
      const result = await inOrder(entry.fieldId, () =>
        portalOnboardingApiService.removeGroupEntry(
          customerId,
          form.id,
          entry.id,
        ),
      );
      if (!result.ok) return false;
      replaceGroup(entry.fieldId, result.value);
      setAnswerFiles((current) =>
        current.filter((link) => link.groupEntryId !== entry.id),
      );
      return true;
    },
    [customerId, form.id, inOrder, replaceGroup],
  );

  const moveEntry = useCallback(
    async (
      entry: QuestionnaireGroupEntryDto,
      direction: -1 | 1,
    ): Promise<QuestionnaireGroupEntryDto[] | null> => {
      const result = await inOrder(entry.fieldId, () =>
        portalOnboardingApiService.moveGroupEntry(
          customerId,
          form.id,
          entry.id,
          direction,
        ),
      );
      if (!result.ok) return null;
      replaceGroup(entry.fieldId, result.value);
      return result.value;
    },
    [customerId, form.id, inOrder, replaceGroup],
  );

  const attachFile = useCallback(
    async (
      slot: { fieldId: string; groupEntryId: string | null },
      file: PortalFileDto,
    ): Promise<PortalOnboardingResult<QuestionnaireAnswerFileDto>> => {
      // An upload can finish before the entry it belongs to exists on the server.
      if (slot.groupEntryId && !(await whenEntryReady(slot.groupEntryId)))
        return { ok: false, code: PortalOnboardingErrorCode.NotFound };
      const result = await track(slot.fieldId, () =>
        portalOnboardingApiService.attachFile(customerId, form.id, {
          ...slot,
          fileId: file.id,
        }),
      );
      if (result.ok)
        setAnswerFiles((current) =>
          current.some((link) => link.id === result.value.id)
            ? current
            : [...current, result.value],
        );
      return result;
    },
    [customerId, form.id, track, whenEntryReady],
  );

  const detachFile = useCallback(
    async (link: QuestionnaireAnswerFileDto) => {
      const result = await track(link.fieldId, () =>
        portalOnboardingApiService.detachFile(customerId, form.id, link.id),
      );
      if (result.ok)
        setAnswerFiles((current) =>
          current.filter((entry) => entry.id !== link.id),
        );
      return result;
    },
    [customerId, form.id, track],
  );

  /** `note` null means the services fit as shown. */
  const confirmServices = useCallback(
    async (note: string | null): Promise<boolean> => {
      const result = await track(SERVICES_ERROR_KEY, () =>
        portalOnboardingApiService.confirmServices(customerId, form.id, note),
      );
      if (!result.ok) return false;
      setServicesConfirmed(true);
      setServicesNote(note);
      return true;
    },
    [customerId, form.id, track],
  );

  /** Waits for everything on its way, so a submission sees what the server holds. */
  const settle = useCallback(async (): Promise<void> => {
    while (runningRef.current.size > 0)
      await Promise.allSettled([...runningRef.current]);
  }, []);

  const busy = inFlight > 0;
  useLeaveWarning(busy, leaveWarning);

  return {
    groupEntries,
    answerFiles,
    servicesConfirmed,
    servicesNote,
    /** Why the last command of a field failed, by field id; the services under their own key. */
    errors,
    servicesError: errors.get(SERVICES_ERROR_KEY) ?? null,
    busy,
    /** When the last of these commands went through here; null before the first one. */
    savedAt,
    addEntry,
    whenEntryReady,
    removeEntry,
    moveEntry,
    attachFile,
    detachFile,
    confirmServices,
    settle,
  };
}
