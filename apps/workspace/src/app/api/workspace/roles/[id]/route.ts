import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateRoleRequestDto } from "@invessiv/common/contracts/auth/update-role-request.dto";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { handleRoleMutation } from "@/lib/workspace/access/access-mutation-route";
import { updateRole } from "@/server/workspace/access/command-handler/update-role.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return handleRoleMutation(request, {
    operation: AccessOperation.UpdateRole,
    successStatus: HttpResponseCode.Ok,
    execute: (body, actor) =>
      updateRole(id, body as UpdateRoleRequestDto, actor),
  });
}
