"use client";

import { useEffect, useRef, useState } from "react";
import type { PagedListPage } from "@/common/contracts/shared/paged-list-page";

/** Shared request lifecycle; wrappers decide pagination, metadata and public statuses. */
export function usePagedList<TEntry, TPosition, TMetadata = undefined>(
  requestKey: string,
  firstPage: TPosition,
  loadPage: (
    position: TPosition,
  ) => Promise<PagedListPage<TEntry, TPosition, TMetadata> | null>,
  initialPage?: PagedListPage<TEntry, TPosition, TMetadata>,
) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([requestKey, attempt]);
  const [data, setData] = useState(() => ({
    key,
    page: initialPage ?? null,
    failed: false,
  }));
  const [loadingMoreKey, setLoadingMoreKey] = useState<string | null>(null);
  const inFlight = useRef<string | null>(null);
  const activeKey = useRef<string | null>(key);
  const loader = useRef({ loadPage, firstPage });

  useEffect(() => {
    loader.current = { loadPage, firstPage };
  });

  useEffect(() => {
    activeKey.current = key;
    let active = true;
    if (!(data.key === key && data.page)) {
      const { loadPage: load, firstPage: position } = loader.current;
      void (async () => {
        let page: PagedListPage<TEntry, TPosition, TMetadata> | null;
        try {
          page = await load(position);
        } catch {
          page = null;
        }
        if (active) setData({ key, page, failed: page === null });
      })();
    }
    return () => {
      active = false;
      activeKey.current = null;
    };
    // Only a new request or retry starts a load; initial data already answers its key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const page = data.key === key ? data.page : null;
  const failed = data.key === key && data.failed;

  async function loadMore(): Promise<number | null> {
    if (!page || page.nextPage === null || inFlight.current === key) return 0;
    inFlight.current = key;
    setLoadingMoreKey(key);
    try {
      const next = await loader.current.loadPage(page.nextPage);
      if (activeKey.current !== key) return 0;
      if (!next) return null;
      setData((current) =>
        current.key === key && current.page
          ? {
              ...current,
              page: {
                ...next,
                entries: [...current.page.entries, ...next.entries],
              },
            }
          : current,
      );
      return next.entries.length;
    } catch {
      return activeKey.current === key ? null : 0;
    } finally {
      if (inFlight.current === key) inFlight.current = null;
      setLoadingMoreKey((current) => (current === key ? null : current));
    }
  }

  function replaceEntry(
    matches: (entry: TEntry) => boolean,
    replacement: TEntry,
  ) {
    setData((current) =>
      current.key === key && current.page
        ? {
            ...current,
            page: {
              ...current.page,
              entries: current.page.entries.map((entry) =>
                matches(entry) ? replacement : entry,
              ),
            },
          }
        : current,
    );
  }

  return {
    page,
    failed,
    loadingMore: loadingMoreKey === key,
    hasMore: page !== null && page.nextPage !== null,
    loadMore,
    reload: () => setAttempt((value) => value + 1),
    replaceEntry,
  };
}
