import "server-only";

import type { NextRequest } from "next/server";
import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withPermission } from "@/lib/auth/api";
import { authApiError } from "@/lib/auth/auth-api-error";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { listAccessCustomerProjects } from "@/server/workspace/access/query-handler/list-access-customer-projects.query-handler";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

/** Same gate and same reason as the customer lookup: not scope-filtered, identification only. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withPermission(Permission.MembersManage, async () => {
    if (!accessSchemas.entityId.safeParse(id).success) {
      return authApiError(AuthErrorCode.NotFound, HttpResponseCode.NotFound);
    }
    try {
      return Response.json(
        { projects: await listAccessCustomerProjects(id) },
        { status: HttpResponseCode.Ok },
      );
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.ListAccessCustomerProjects, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }
  })(request);
}
