import "server-only";
import type { NextRequest } from "next/server";
import { PortalHoursQueryParam } from "@/common/constants/portal/portal-hours-query-params";
import {
  portalHoursErrorResponse,
  privatePortalHoursResponse,
} from "@/lib/portal/portal-hours-api-error";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { listPortalTimeEntries } from "@/server/portal/query-handler/list-portal-time-entries.query-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ customerId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;
  return privatePortalHoursResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (req, reader) => {
      const query = req.nextUrl.searchParams;
      const result = await listPortalTimeEntries(reader, {
        projectId: query.get(PortalHoursQueryParam.ProjectId) ?? undefined,
        cursor: query.get(PortalHoursQueryParam.Cursor) ?? undefined,
      });
      return result.ok
        ? Response.json(result.page)
        : portalHoursErrorResponse(result.code);
    })(request),
  );
}
