"use client";

import { useEffect, useState } from "react";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import type { FileListPageDto } from "@invessiv/common/contracts/files/file-list-page.dto";
import { filesApiService } from "@/client/crm/files-api-service";
import { FileListLoadStatus } from "@/common/constants/crm/files/file-list-load-status";
import type { CustomerFilesFilter } from "@/common/contracts/crm/files/customer-files-filter";
import { customerFilesFilter } from "@/common/patterns/crm/files/customer-files-filter";

/**
 * Loads the files of one customer page by page through the API. Every answer is tagged with the
 * request it belongs to, so a slow answer to an old filter never overwrites the current list;
 * the previous list stays visible while the next one loads. `revision` reloads from the first
 * page whenever another section of the cockpit changed files.
 */
export function useCustomerFiles(
  customerId: string,
  filter: CustomerFilesFilter,
  revision: number,
) {
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<(FileListPageDto & { key: string }) | null>(
    null,
  );
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const query = customerFilesFilter.toListQuery(filter, 1);
  const key = JSON.stringify([customerId, query, revision, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    // `key` (built from the same values) is the effect's only dependency; it just tags which
    // request this response belongs to. `customerId`/`query` come straight from the closure.
    void filesApiService.listFiles(customerId, query).then((result) => {
      if (cancelled) return;
      if (result.ok) setData({ ...result.value, key });
      else setFailedKey(key);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function loadMore() {
    if (!data || data.key !== key || loadingMore) return;
    setLoadingMore(true);
    const result = await filesApiService.listFiles(customerId, {
      ...query,
      page: data.page + 1,
    });
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

  const files = data?.files ?? [];
  const total = data?.total ?? 0;
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
    replace: (file: FileDto) =>
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
