import "server-only";

import type { NextRequest } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { ListClerkCandidatesRequestDto } from "@invessiv/common/contracts/auth/list-clerk-candidates-request.dto";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { listClerkCandidates } from "@/server/workspace/access/query-handler/list-clerk-candidates.query-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withPermission(Permission.MembersManage, async (req) => {
    const body = await readJsonBody(req);
    if (!body.ok) {
      return memberApiError(WorkspaceMemberErrorCode.ValidationError);
    }
    let result;
    try {
      result = await listClerkCandidates(
        body.body as ListClerkCandidatesRequestDto,
      );
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.ListClerkCandidates, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }

    if (!result.ok) {
      return memberApiError(
        result.code,
        "errors" in result ? result.errors : undefined,
      );
    }

    return Response.json(
      { candidates: result.candidates },
      { status: HttpResponseCode.Ok },
    );
  })(request);
}
