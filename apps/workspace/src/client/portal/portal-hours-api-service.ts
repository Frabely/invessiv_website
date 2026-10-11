import { z } from "zod";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import {
  PORTAL_HOURS_ERROR_CODE_VALUES,
  PortalHoursErrorCode,
} from "@invessiv/common/constants/portal/portal-hours-error-codes";
import type { PortalTimeEntryListQueryDto } from "@invessiv/common/contracts/portal/portal-time-entry-list-query.dto";
import type { PortalTimeEntryPageDto } from "@invessiv/common/contracts/portal/portal-time-entry-page.dto";
import { versionedJsonMutationService as json } from "@/client/shared/versioned-json-mutation-service";
import { PortalHoursQueryParam } from "@/common/constants/portal/portal-hours-query-params";
import type { JsonClientResult } from "@/common/contracts/client/json-client-result";
import { readApiErrorCode } from "@/common/patterns/client/read-api-error-code";
import { portalHoursEntriesEndpoint } from "@/common/patterns/portal/portal-api-endpoints";

const timeEntryPageSchema: z.ZodType<PortalTimeEntryPageDto> = z.object({
  entries: z.array(
    z.object({
      id: z.string(),
      projectId: z.string().nullable(),
      performedOn: z.string(),
      durationMinutes: z.number().int(),
      description: z.string(),
      billable: z.boolean(),
      taskTitle: z.string().nullable(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

/**
 * One page of the company's time entries. The company is the one in the URL the portal gate
 * verified; the query only narrows to a project and continues after a cursor.
 */
async function listTimeEntries(
  customerId: string,
  query: PortalTimeEntryListQueryDto,
): Promise<JsonClientResult<PortalTimeEntryPageDto, PortalHoursErrorCode>> {
  const params = new URLSearchParams();
  if (query.projectId)
    params.set(PortalHoursQueryParam.ProjectId, query.projectId);
  if (query.cursor) params.set(PortalHoursQueryParam.Cursor, query.cursor);
  const search = params.toString();
  const endpoint = portalHoursEntriesEndpoint(customerId);

  return json.request(
    search ? `${endpoint}?${search}` : endpoint,
    HttpMethod.Get,
    undefined,
    (payload) => {
      const page = timeEntryPageSchema.safeParse(payload);
      return page.success ? page.data : null;
    },
    (payload) =>
      readApiErrorCode(
        payload,
        PORTAL_HOURS_ERROR_CODE_VALUES,
        PortalHoursErrorCode.Internal,
      ),
    PortalHoursErrorCode.Internal,
  );
}

export const portalHoursApiService = { listTimeEntries } as const;
