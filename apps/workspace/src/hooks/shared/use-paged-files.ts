"use client";

import { FileListLoadStatus } from "@/common/constants/files/file-list-load-status";
import type { FileClientResult } from "@/common/contracts/files/file-client-result";
import type { PagedFiles } from "@/common/contracts/files/paged-files";
import type { PagedListPage } from "@/common/contracts/shared/paged-list-page";
import { usePagedList } from "./use-paged-list";

/** Page-number pagination with server-rendered initial data and local file replacement. */
export function usePagedFiles<TFile extends { id: string }>(
  requestKey: string,
  loadPage: (page: number) => Promise<FileClientResult<PagedFiles<TFile>>>,
  initialPage?: PagedFiles<TFile>,
) {
  function normalize(
    page: PagedFiles<TFile>,
  ): PagedListPage<TFile, number, number> {
    return {
      entries: page.files,
      nextPage: page.page * page.pageSize < page.total ? page.page + 1 : null,
      metadata: page.total,
    };
  }
  const list = usePagedList<TFile, number, number>(
    requestKey,
    1,
    async (page) => {
      const result = await loadPage(page);
      return result.ok ? normalize(result.value) : null;
    },
    initialPage ? normalize(initialPage) : undefined,
  );

  return {
    files: list.page?.entries ?? [],
    total: list.page?.metadata ?? 0,
    status: list.loadingMore
      ? FileListLoadStatus.LoadingMore
      : list.failed
        ? FileListLoadStatus.Error
        : list.page
          ? FileListLoadStatus.Ready
          : FileListLoadStatus.Loading,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    reload: list.reload,
    replace: (file: TFile) =>
      list.replaceEntry((entry) => entry.id === file.id, file),
  };
}
