import "server-only";

import type { NextRequest } from "next/server";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withPermission } from "@/lib/auth/api";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { listAccessCustomers } from "@/server/workspace/access/query-handler/list-access-customers.query-handler";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";

export const runtime = "nodejs";

/**
 * Gated by `members.manage` alone. Not a CRM endpoint: it must answer for a manager without
 * `customers.read`, and it returns nothing beyond number and display name.
 */
export async function GET(request: NextRequest) {
  return withPermission(Permission.MembersManage, async (req) => {
    const validation = accessSchemas.listAccessCustomers.safeParse({
      search: new URL(req.url).searchParams.get("search") ?? undefined,
    });
    if (!validation.success) {
      return memberApiError(
        WorkspaceMemberErrorCode.ValidationError,
        validation.error.issues,
      );
    }
    try {
      return Response.json(
        { customers: await listAccessCustomers(validation.data.search) },
        { status: HttpResponseCode.Ok },
      );
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.ListAccessCustomers, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }
  })(request);
}
