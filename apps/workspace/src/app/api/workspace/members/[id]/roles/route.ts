import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { ReplaceWorkspaceMemberRolesRequestDto } from "@invessiv/common/contracts/auth/replace-workspace-member-roles-request.dto";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { handleMemberMutation } from "@/lib/workspace/access/access-mutation-route";
import { replaceWorkspaceMemberRoles } from "@/server/workspace/access/command-handler/replace-workspace-member-roles.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return handleMemberMutation(request, {
    operation: AccessOperation.ReplaceMemberRoles,
    successStatus: HttpResponseCode.Ok,
    execute: (body, actor) =>
      replaceWorkspaceMemberRoles(
        id,
        body as ReplaceWorkspaceMemberRolesRequestDto,
        actor,
      ),
  });
}
