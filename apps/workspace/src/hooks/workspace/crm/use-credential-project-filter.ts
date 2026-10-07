"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { credentialProjectFilter } from "@/common/patterns/crm/credentials/credential-project-filter";

/**
 * Project filter of the credentials section, kept in the URL under its own parameter. Written with
 * `history.replaceState`, so filtering does not request a new server rendering. Next's search
 * params subscription also follows back/forward navigation and later URL changes.
 */
export function useCredentialProjectFilter(
  readableProjectIds: readonly string[],
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = credentialProjectFilter.read(
    new URLSearchParams(searchParams.toString()),
    readableProjectIds,
  );

  function setProjectId(next: string | null | undefined) {
    const query = credentialProjectFilter
      .write(new URLSearchParams(window.location.search), next)
      .toString();
    window.history.replaceState(
      // Next copies its internal state and updates useSearchParams for external writes.
      null,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
  }

  return { projectId, setProjectId };
}
