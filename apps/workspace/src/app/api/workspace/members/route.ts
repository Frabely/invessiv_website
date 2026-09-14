import "server-only";

import type { NextRequest } from "next/server";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { AddWorkspaceMemberRequestDto } from "@invessiv/common/contracts/auth/add-workspace-member-request.dto";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withPermission } from "@/lib/auth/api";
import { handleMemberMutation } from "@/lib/workspace/access/access-mutation-route";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { addWorkspaceMember } from "@/server/workspace/access/command-handler/add-workspace-member.command-handler";
import { listWorkspaceMemberOptions } from "@/server/workspace/access/query-handler/list-workspace-member-options.query-handler";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withPermission(Permission.MembersRead, async () => {
    try {
      const members = await listWorkspaceMemberOptions();
      return Response.json({ members }, { status: HttpResponseCode.Ok });
    } catch (error: unknown) {
      logAccessFailure(AccessOperation.ListMembers, error);
      return memberApiError(WorkspaceMemberErrorCode.Internal);
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return handleMemberMutation(request, {
    operation: AccessOperation.AddMember,
    successStatus: HttpResponseCode.Created,
    execute: (body, actor) =>
      addWorkspaceMember(body as AddWorkspaceMemberRequestDto, actor),
  });
}
