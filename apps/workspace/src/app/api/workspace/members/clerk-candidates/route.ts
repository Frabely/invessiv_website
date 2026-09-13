import "server-only";

import type { NextRequest } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withPermission } from "@/lib/auth/api";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { listClerkCandidates } from "@/server/workspace/access/query-handler/list-clerk-candidates.query-handler";

export const runtime = "nodejs";

const QUERY_MAX_LENGTH = 100;

export async function GET(request: NextRequest) {
  return withPermission(Permission.MembersManage, async (req) => {
    const rawQuery = new URL(req.url).searchParams.get("query")?.trim() ?? "";
    const query = rawQuery ? rawQuery.slice(0, QUERY_MAX_LENGTH) : null;

    let result;
    try {
      result = await listClerkCandidates(query);
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.ListClerkCandidates, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }

    if (!result.ok) {
      return memberApiError(result.code);
    }

    return Response.json(
      { candidates: result.candidates },
      { status: HttpResponseCode.Ok },
    );
  })(request);
}
