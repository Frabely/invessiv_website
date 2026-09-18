import "server-only";

import type { NextRequest } from "next/server";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { revokeAccessScope } from "@/server/workspace/access/command-handler/revoke-access-scope.command-handler";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string; scopeId: string }> };

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id, scopeId } = await params;
  return withPermission(Permission.MembersManage, async (req, actor) => {
    if (
      !accessSchemas.entityId.safeParse(id).success ||
      !accessSchemas.entityId.safeParse(scopeId).success
    )
      return memberApiError(WorkspaceMemberErrorCode.AccessScopeNotFound);
    const parsed = await readJsonBody(req);
    if (!parsed.ok)
      return memberApiError(WorkspaceMemberErrorCode.ValidationError);
    const validation = accessSchemas.revokeAccessScope.safeParse(parsed.body);
    if (!validation.success)
      return memberApiError(
        WorkspaceMemberErrorCode.ValidationError,
        validation.error.issues,
      );
    try {
      const result = await revokeAccessScope(
        id,
        scopeId,
        validation.data,
        actor,
      );
      if (!result.ok)
        return "conflict" in result
          ? Response.json(result.conflict, {
              status: HttpResponseCode.Conflict,
            })
          : memberApiError(result.code, result.errors);
      return Response.json(
        { member: result.member },
        { status: HttpResponseCode.Ok },
      );
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.RevokeMemberAccessScope, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }
  })(request);
}
