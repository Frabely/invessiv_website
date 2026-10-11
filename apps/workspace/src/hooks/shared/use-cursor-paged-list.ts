"use client";

import { TimeEntryListLoadStatus } from "@/common/constants/crm/time-entry-list-load-status";
import type { CursorListPage } from "@/common/contracts/shared/cursor-list-page";
import { usePagedList } from "./use-paged-list";

/** Cursor pagination for time entry lists in the CRM and portal. */
export function useCursorPagedList<TEntry>(
  requestKey: string,
  loadPageAction: (
    cursor: string | null,
  ) => Promise<CursorListPage<TEntry> | null>,
) {
  const list = usePagedList<TEntry, string | null>(
    requestKey,
    null,
    async (cursor) => {
      const page = await loadPageAction(cursor);
      return page
        ? {
            entries: page.entries,
            nextPage: page.nextCursor,
            metadata: undefined,
          }
        : null;
    },
  );
  return {
    entries: list.page?.entries ?? [],
    hasMore: list.hasMore,
    loadingMore: list.loadingMore,
    loadMore: list.loadMore,
    retry: list.reload,
    status: list.failed
      ? TimeEntryListLoadStatus.Error
      : list.page
        ? TimeEntryListLoadStatus.Ready
        : TimeEntryListLoadStatus.Loading,
  };
}
