"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { CustomerFilesFilter } from "@/common/contracts/crm/files/customer-files-filter";
import { customerFilesFilter } from "@/common/patterns/crm/files/customer-files-filter";

/**
 * Filter state of a files section. With `syncUrl` the project, type and origin filters live in
 * the URL; they are written with `history.replaceState`, which Next.js picks up without a server
 * round trip, so filtering never re-renders the cockpit. A fixed project pins the project filter.
 * The search debounce lives in `ListSearchField`; this hook only ever sees the committed value.
 */
export function useCustomerFilesFilter(options: {
  readableProjectIds: readonly string[];
  syncUrl: boolean;
  fixedProjectId?: string;
}) {
  const { readableProjectIds, syncUrl, fixedProjectId } = options;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filter, setFilterState] = useState<CustomerFilesFilter>(() =>
    fixedProjectId
      ? { projectId: fixedProjectId, search: "" }
      : syncUrl
        ? customerFilesFilter.read(
            new URLSearchParams(searchParams.toString()),
            readableProjectIds,
          )
        : { search: "" },
  );

  function setSearch(search: string) {
    setFilterState((current) => ({ ...current, search }));
  }

  function setFilter(next: Omit<CustomerFilesFilter, "search">) {
    const merged = {
      ...next,
      projectId: fixedProjectId ?? next.projectId,
      search: filter.search,
    };
    setFilterState(merged);
    if (!syncUrl) return;
    const params = customerFilesFilter.write(
      new URLSearchParams(window.location.search),
      merged,
    );
    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
  }

  function reset() {
    setFilter({});
    setFilterState((current) => ({ ...current, search: "" }));
  }

  return { filter, setFilter, setSearch, reset };
}
