import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { ChangeWorkspaceOwnerRequestDto } from "@invessiv/common/contracts/auth/change-workspace-owner-request.dto";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { handleMemberMutation } from "@/lib/workspace/access/access-mutation-route";
import { grantWorkspaceOwner } from "@/server/workspace/access/command-handler/grant-workspace-owner.command-handler";
import { revokeWorkspaceOwner } from "@/server/workspace/access/command-handler/revoke-workspace-owner.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return handleMemberMutation(request, {
    operation: AccessOperation.GrantOwner,
    successStatus: HttpResponseCode.Ok,
    execute: (body, actor) =>
      grantWorkspaceOwner(id, body as ChangeWorkspaceOwnerRequestDto, actor),
  });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  return handleMemberMutation(request, {
    operation: AccessOperation.RevokeOwner,
    successStatus: HttpResponseCode.Ok,
    execute: (body, actor) =>
      revokeWorkspaceOwner(id, body as ChangeWorkspaceOwnerRequestDto, actor),
  });
}
