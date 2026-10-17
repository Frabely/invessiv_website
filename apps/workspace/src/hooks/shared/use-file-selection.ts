"use client";

import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";
import { useUrlSearch } from "./use-url-search";

/**
 * Selection is URL state so pagination and rerenders preserve it. The value is bound to the
 * customer, so a link carried to another company selects nothing.
 */
export function useFileSelection(customerId: string, queryParam: string) {
  const { search, replace: replaceSearch } = useUrlSearch();
  const raw = new URLSearchParams(search).get(queryParam);
  const ids = raw?.startsWith(`${customerId}:`)
    ? raw
        .slice(customerId.length + 1)
        .split(",")
        .filter(Boolean)
    : [];
  const selectedIds = [...new Set(ids)].slice(0, MAX_ARCHIVE_FILES);

  function replace(nextIds: readonly string[]) {
    replaceSearch((params) => {
      if (nextIds.length)
        params.set(queryParam, `${customerId}:${nextIds.join(",")}`);
      else params.delete(queryParam);
    });
  }

  function toggle(id: string) {
    replace(
      selectedIds.includes(id)
        ? selectedIds.filter((selected) => selected !== id)
        : [...selectedIds, id].slice(0, MAX_ARCHIVE_FILES),
    );
  }

  function add(idsToAdd: readonly string[]) {
    replace(
      [...new Set([...selectedIds, ...idsToAdd])].slice(0, MAX_ARCHIVE_FILES),
    );
  }

  function remove(id: string) {
    if (selectedIds.includes(id))
      replace(selectedIds.filter((selected) => selected !== id));
  }

  function removeMany(idsToRemove: readonly string[]) {
    replace(selectedIds.filter((selected) => !idsToRemove.includes(selected)));
  }

  return {
    selectedIds,
    toggle,
    add,
    remove,
    removeMany,
    clear: () => replace([]),
  };
}
