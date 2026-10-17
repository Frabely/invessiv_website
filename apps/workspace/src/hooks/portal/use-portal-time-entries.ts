"use client";

import type { PortalTimeEntryDto } from "@invessiv/common/contracts/portal/portal-time-entry.dto";
import { portalHoursApiService } from "@/client/portal/portal-hours-api-service";
import { useCursorPagedList } from "@/hooks/shared/use-cursor-paged-list";

/**
 * The time entry list of the hours dialog: loaded when the dialog opens, never with the dashboard,
 * and page by page afterwards. A new project starts again from page one; null lists every project.
 */
export function usePortalTimeEntries(
  customerId: string,
  projectId: string | null,
) {
  return useCursorPagedList<PortalTimeEntryDto>(
    JSON.stringify([customerId, projectId]),
    async (cursor) => {
      const result = await portalHoursApiService.listTimeEntries(customerId, {
        projectId: projectId ?? undefined,
        ...(cursor ? { cursor } : {}),
      });
      return result.ok ? result.value : null;
    },
  );
}
