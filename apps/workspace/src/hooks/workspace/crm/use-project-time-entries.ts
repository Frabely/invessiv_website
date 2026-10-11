"use client";

import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { hoursApiService } from "@/client/crm/hours-api-service";
import { useCursorPagedList } from "@/hooks/shared/use-cursor-paged-list";

/**
 * Loads the time entries of one project page by page through the API. `revision` reloads the first
 * page after a write, so the list never has to guess where a changed entry now sorts.
 */
export function useProjectTimeEntries(projectId: string, revision: number) {
  return useCursorPagedList<TimeEntryDto>(
    JSON.stringify([projectId, revision]),
    async (cursor) => {
      const result = await hoursApiService.listTimeEntries(projectId, cursor);
      return result.ok ? result.value : null;
    },
  );
}
