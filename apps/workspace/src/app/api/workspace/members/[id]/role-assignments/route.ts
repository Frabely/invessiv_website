import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { ReplaceMemberRoleAssignmentsRequestDto } from "@invessiv/common/contracts/auth/replace-member-role-assignments-request.dto";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { handleMemberMutation } from "@/lib/workspace/access/access-mutation-route";
import { replaceMemberRoleAssignments } from "@/server/workspace/access/command-handler/replace-member-role-assignments.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return handleMemberMutation(request, {
    operation: AccessOperation.ReplaceMemberRoleAssignments,
    successStatus: HttpResponseCode.Ok,
    execute: (body, actor) =>
      replaceMemberRoleAssignments(
        id,
        body as ReplaceMemberRoleAssignmentsRequestDto,
        actor,
      ),
  });
}
