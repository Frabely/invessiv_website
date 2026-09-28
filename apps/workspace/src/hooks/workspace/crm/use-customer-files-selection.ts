"use client";

import { useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MAX_ARCHIVE_FILES } from "@/common/constants/crm/files/file-archive-limits";
import { CustomerFilesQueryParam } from "@/common/constants/crm/files/customer-files-query-params";
import { FileSelectionEvent } from "@/common/constants/crm/files/file-selection-events";

function subscribeToUrlChanges(onChange: () => void) {
  // replaceState does not emit popstate, so selection writes notify mounted file sections.
  window.addEventListener(FileSelectionEvent.Changed, onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener(FileSelectionEvent.Changed, onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function currentSearch() {
  return window.location.search.slice(1);
}

/** Selection is URL state so pagination and cockpit rerenders preserve it. */
export function useCustomerFilesSelection(customerId: string) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useSyncExternalStore(
    subscribeToUrlChanges,
    currentSearch,
    () => searchParams.toString(),
  );
  const raw = new URLSearchParams(search).get(CustomerFilesQueryParam.Selected);
  const ids = raw?.startsWith(`${customerId}:`)
    ? raw
        .slice(customerId.length + 1)
        .split(",")
        .filter(Boolean)
    : [];
  const selectedIds = [...new Set(ids)].slice(0, MAX_ARCHIVE_FILES);

  function replace(nextIds: readonly string[]) {
    const params = new URLSearchParams(window.location.search);
    if (nextIds.length)
      params.set(
        CustomerFilesQueryParam.Selected,
        `${customerId}:${nextIds.join(",")}`,
      );
    else params.delete(CustomerFilesQueryParam.Selected);
    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
    window.dispatchEvent(new Event(FileSelectionEvent.Changed));
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

  return { selectedIds, toggle, add, remove, clear: () => replace([]) };
}
