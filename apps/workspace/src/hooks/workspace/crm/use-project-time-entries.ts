"use client";

import { useEffect, useState } from "react";

import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { hoursApiService } from "@/client/crm/hours-api-service";
import { TimeEntryListLoadStatus } from "@/common/constants/crm/time-entry-list-load-status";

type TimeEntryListState = {
  /** The request these entries answer; a different key means they are stale. */
  key: string;
  status: TimeEntryListLoadStatus;
  entries: TimeEntryDto[];
  nextCursor: string | null;
};

/**
 * Loads the time entries of one project page by page through the API. `revision` reloads the first
 * page after a write, so the list never has to guess where a changed entry now sorts.
 */
export function useProjectTimeEntries(projectId: string, revision: number) {
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const key = JSON.stringify([projectId, revision, attempt]);
  const [state, setState] = useState<TimeEntryListState>({
    key,
    status: TimeEntryListLoadStatus.Loading,
    entries: [],
    nextCursor: null,
  });

  useEffect(() => {
    let active = true;
    void hoursApiService.listTimeEntries(projectId, null).then((result) => {
      if (!active) return;
      setState(
        result.ok
          ? {
              key,
              status: TimeEntryListLoadStatus.Ready,
              entries: result.value.entries,
              nextCursor: result.value.nextCursor,
            }
          : {
              key,
              status: TimeEntryListLoadStatus.Error,
              entries: [],
              nextCursor: null,
            },
      );
    });
    return () => {
      active = false;
    };
  }, [projectId, key]);

  // Stale entries are never shown while a reload is pending.
  const current: TimeEntryListState =
    state.key === key
      ? state
      : {
          key,
          status: TimeEntryListLoadStatus.Loading,
          entries: [],
          nextCursor: null,
        };

  /** Appends the next page; resolves to how many entries arrived, or null when it failed. */
  async function loadMore(): Promise<number | null> {
    if (!current.nextCursor || loadingMore) return 0;
    setLoadingMore(true);
    const result = await hoursApiService.listTimeEntries(
      projectId,
      current.nextCursor,
    );
    setLoadingMore(false);
    if (!result.ok) return null;
    setState((previous) =>
      previous.key === key
        ? {
            ...previous,
            entries: [...previous.entries, ...result.value.entries],
            nextCursor: result.value.nextCursor,
          }
        : previous,
    );
    return result.value.entries.length;
  }

  return {
    entries: current.entries,
    hasMore: current.nextCursor !== null,
    loadingMore,
    loadMore,
    retry: () => setAttempt((value) => value + 1),
    status: current.status,
  };
}
