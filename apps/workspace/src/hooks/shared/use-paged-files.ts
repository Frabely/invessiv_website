"use client";

import { useEffect, useRef, useState } from "react";
import { FileListLoadStatus } from "@/common/constants/files/file-list-load-status";
import type { FileClientResult } from "@/common/contracts/files/file-client-result";
import type { PagedFiles } from "@/common/contracts/files/paged-files";

/**
 * Loads a file list page by page. Every answer is tagged with the request key it belongs to, so a
 * slow answer to an old filter never overwrites the current list. Only data matching the active
 * request is exposed, so a different tab never shows entries from the previous one.
 */
export function usePagedFiles<TFile extends { id: string }>(
  requestKey: string,
  loadPage: (page: number) => Promise<FileClientResult<PagedFiles<TFile>>>,
  initialPage?: PagedFiles<TFile>,
) {
  const [reloadKey, setReloadKey] = useState(0);
  const key = JSON.stringify([requestKey, reloadKey]);
  const [data, setData] = useState<
    (PagedFiles<TFile> & { key: string }) | null
  >(initialPage ? { ...initialPage, key } : null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadRef = useRef(loadPage);

  useEffect(() => {
    loadRef.current = loadPage;
  });

  useEffect(() => {
    if (data?.key === key) return;
    let cancelled = false;
    void loadRef.current(1).then((result) => {
      if (cancelled) return;
      if (result.ok) setData({ ...result.value, key });
      else setFailedKey(key);
    });
    return () => {
      cancelled = true;
    };
    // `key` alone decides when to load; a server-rendered page already carries its key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function loadMore() {
    if (!data || data.key !== key || loadingMore) return;
    setLoadingMore(true);
    const result = await loadRef.current(data.page + 1);
    setLoadingMore(false);
    if (!result.ok) return;
    setData((current) =>
      current?.key === key
        ? {
            ...result.value,
            files: [...current.files, ...result.value.files],
            key,
          }
        : current,
    );
  }

  const files = data?.key === key ? data.files : [];
  const total = data?.key === key ? data.total : 0;
  let status: FileListLoadStatus = FileListLoadStatus.Loading;
  if (data?.key === key) status = FileListLoadStatus.Ready;
  if (failedKey === key) status = FileListLoadStatus.Error;
  if (loadingMore) status = FileListLoadStatus.LoadingMore;

  return {
    files,
    total,
    status,
    hasMore: files.length < total,
    loadMore,
    reload: () => setReloadKey((current) => current + 1),
    replace: (file: TFile) =>
      setData((current) =>
        current && current.key === key
          ? {
              ...current,
              files: current.files.map((entry) =>
                entry.id === file.id ? file : entry,
              ),
            }
          : current,
      ),
  };
}
