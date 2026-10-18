"use client";

import { useMemo } from "react";
import { useUrlSearch } from "@/hooks/shared/use-url-search";

/** Local step URL state, with an explicit field-lifetime policy for navigation guards. */
export function usePortalStepSearch(
  sectionParam: string,
  fieldParam?: string,
  preservesFields = false,
) {
  const localParams = useMemo(
    () => (fieldParam ? [sectionParam, fieldParam] : [sectionParam]),
    [sectionParam, fieldParam],
  );
  return useUrlSearch({ localParams, preservesFields });
}
