import "server-only";

import type { NextRequest } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateRoleRequestDto } from "@invessiv/common/contracts/auth/create-role-request.dto";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withPermission } from "@/lib/auth/api";
import { handleRoleMutation } from "@/lib/workspace/access/access-mutation-route";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { roleApiError } from "@/lib/workspace/access/role-api-error";
import { createRole } from "@/server/workspace/access/command-handler/create-role.command-handler";
import { listRoles } from "@/server/workspace/access/query-handler/list-roles.query-handler";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withPermission(Permission.RolesManage, async () => {
    try {
      const roles = await listRoles();
      return Response.json({ roles }, { status: HttpResponseCode.Ok });
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.ListRoles, error);
      return roleApiError(RoleErrorCode.Internal);
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return handleRoleMutation(request, {
    operation: AccessOperation.CreateRole,
    successStatus: HttpResponseCode.Created,
    execute: (body, actor) => createRole(body as CreateRoleRequestDto, actor),
  });
}
