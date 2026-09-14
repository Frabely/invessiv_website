import "server-only";

import type { NextRequest } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { listClerkCandidates } from "@/server/workspace/access/query-handler/list-clerk-candidates.query-handler";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withPermission(Permission.MembersManage, async (req) => {
    const body = await readJsonBody(req);
    if (!body.ok) {
      return memberApiError(WorkspaceMemberErrorCode.ValidationError);
    }
    const validation = accessSchemas.listClerkCandidates.safeParse(body.body);
    if (!validation.success) {
      return memberApiError(
        WorkspaceMemberErrorCode.ValidationError,
        validation.error.issues,
      );
    }
    const query = validation.data.query || null;

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
