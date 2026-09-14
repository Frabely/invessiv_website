import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateWorkspaceMemberStatusRequestDto } from "@invessiv/common/contracts/auth/update-workspace-member-status-request.dto";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { handleMemberMutation } from "@/lib/workspace/access/access-mutation-route";
import { updateWorkspaceMemberStatus } from "@/server/workspace/access/command-handler/update-workspace-member-status.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return handleMemberMutation(request, {
    operation: AccessOperation.UpdateMemberStatus,
    successStatus: HttpResponseCode.Ok,
    execute: (body, actor) =>
      updateWorkspaceMemberStatus(
        id,
        body as UpdateWorkspaceMemberStatusRequestDto,
        actor,
      ),
  });
}
