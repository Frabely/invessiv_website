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
import { grantAccessScope } from "@/server/workspace/access/command-handler/grant-access-scope.command-handler";
import { replaceAccessScopes } from "@/server/workspace/access/command-handler/replace-access-scopes.command-handler";
import { listMemberAccessScopes } from "@/server/workspace/access/query-handler/list-member-access-scopes.query-handler";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withPermission(Permission.MembersManage, async () => {
    try {
      if (!accessSchemas.entityId.safeParse(id).success)
        return memberApiError(WorkspaceMemberErrorCode.MemberNotFound);
      if (
        !(await workspaceMemberReadService.findById(
          getDrizzleDatabaseClient(),
          id,
        ))
      )
        return memberApiError(WorkspaceMemberErrorCode.MemberNotFound);
      return Response.json(
        { accessScopes: await listMemberAccessScopes(id) },
        { status: HttpResponseCode.Ok },
      );
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.ListMemberAccessScopes, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }
  })(request);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withPermission(Permission.MembersManage, async (req, actor) => {
    const parsed = await readJsonBody(req);
    if (!parsed.ok)
      return memberApiError(WorkspaceMemberErrorCode.ValidationError);
    const validation = accessSchemas.grantAccessScope.safeParse(parsed.body);
    if (!validation.success)
      return memberApiError(
        WorkspaceMemberErrorCode.ValidationError,
        validation.error.issues,
      );
    try {
      const result = await grantAccessScope(id, validation.data, actor);
      if (!result.ok)
        return "conflict" in result
          ? Response.json(result.conflict, {
              status: HttpResponseCode.Conflict,
            })
          : memberApiError(result.code, result.errors);
      return Response.json(
        {
          accessScope: result.accessScope,
          member: result.member,
        },
        { status: HttpResponseCode.Created },
      );
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.GrantMemberAccessScope, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }
  })(request);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withPermission(Permission.MembersManage, async (req, actor) => {
    const parsed = await readJsonBody(req);
    if (!parsed.ok)
      return memberApiError(WorkspaceMemberErrorCode.ValidationError);
    const validation = accessSchemas.replaceAccessScopes.safeParse(parsed.body);
    if (!validation.success)
      return memberApiError(
        WorkspaceMemberErrorCode.ValidationError,
        validation.error.issues,
      );
    try {
      const result = await replaceAccessScopes(id, validation.data, actor);
      if (!result.ok)
        return "conflict" in result
          ? Response.json(result.conflict, {
              status: HttpResponseCode.Conflict,
            })
          : memberApiError(
              result.code,
              "errors" in result ? result.errors : undefined,
            );
      return Response.json(
        { member: result.member },
        { status: HttpResponseCode.Ok },
      );
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.ReplaceMemberAccessScopes, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }
  })(request);
}
