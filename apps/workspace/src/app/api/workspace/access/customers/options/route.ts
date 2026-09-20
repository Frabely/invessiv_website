import "server-only";

import type { NextRequest } from "next/server";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withPermission } from "@/lib/auth/api";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { listAccessCustomerOptions } from "@/server/workspace/access/query-handler/list-access-customer-options.query-handler";

export const runtime = "nodejs";

/** Customer identifiers only; this remains available to members managers without CRM read access. */
export async function GET(request: NextRequest) {
  return withPermission(Permission.MembersManage, async () => {
    try {
      return Response.json(
        { customers: await listAccessCustomerOptions() },
        { status: HttpResponseCode.Ok },
      );
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.ListAccessCustomers, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }
  })(request);
}
