import "server-only";

import type { NextRequest } from "next/server";

import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { AddWorkspaceMemberResult } from "@invessiv/common/contracts/auth/results/add-workspace-member-result";
import type { ChangeWorkspaceOwnerResult } from "@invessiv/common/contracts/auth/results/change-workspace-owner-result";
import type { CreateRoleResult } from "@invessiv/common/contracts/auth/results/create-role-result";
import type { ReplaceWorkspaceMemberRolesResult } from "@invessiv/common/contracts/auth/results/replace-workspace-member-roles-result";
import type { UpdateRoleResult } from "@invessiv/common/contracts/auth/results/update-role-result";
import type { UpdateWorkspaceMemberStatusResult } from "@invessiv/common/contracts/auth/results/update-workspace-member-status-result";
import type { AccessOperation } from "@/common/constants/access/access-operations";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { withPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { roleApiError } from "@/lib/workspace/access/role-api-error";

type AccessMutationOutcome =
  | { ok: true }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: unknown;
    }
  | {
      ok: false;
      code: string;
      errors?: unknown;
      responsibilityCounts?: unknown;
    };

type MemberMutationResult =
  | AddWorkspaceMemberResult
  | ReplaceWorkspaceMemberRolesResult
  | ChangeWorkspaceOwnerResult
  | UpdateWorkspaceMemberStatusResult;

type RoleMutationResult = CreateRoleResult | UpdateRoleResult;

type MutationRouteOptions<TResult> = {
  execute: (body: unknown, actor: WorkspaceActor) => Promise<TResult>;
  operation: AccessOperation;
  successStatus: HttpResponseCode;
};

/**
 * One request pipeline for every access mutation: permission gate, JSON body, logged 500 for
 * unexpected failures, `VersionConflictDto` for 409 and the domain error map for the rest.
 */
function handleAccessMutation<
  TResult extends AccessMutationOutcome,
  TCode extends string,
>(
  request: NextRequest,
  options: MutationRouteOptions<TResult> & {
    errorResponse: (code: TCode, details?: unknown) => Response;
    internalCode: TCode;
    permission: Permission;
    successResponse: (result: Extract<TResult, { ok: true }>) => Response;
    validationCode: TCode;
  },
): Promise<Response> {
  return withPermission(options.permission, async (req, actor) => {
    const parsed = await readJsonBody(req);
    if (!parsed.ok) {
      return options.errorResponse(options.validationCode);
    }

    let result: TResult;
    try {
      // The command validates the body against its schema before using it.
      result = await options.execute(parsed.body, actor);
    } catch (error: unknown) {
      logAccessFailure(options.operation, error);
      return options.errorResponse(options.internalCode);
    }

    const outcome: AccessMutationOutcome = result;
    if (outcome.ok) {
      return options.successResponse(result as Extract<TResult, { ok: true }>);
    }
    if ("conflict" in outcome) {
      return Response.json(outcome.conflict, {
        status: HttpResponseCode.Conflict,
      });
    }
    const details =
      "errors" in outcome && outcome.errors !== undefined
        ? outcome.errors
        : "responsibilityCounts" in outcome &&
            outcome.responsibilityCounts !== undefined
          ? { responsibilityCounts: outcome.responsibilityCounts }
          : undefined;
    return options.errorResponse(outcome.code as TCode, details);
  })(request);
}

export function handleMemberMutation<TResult extends MemberMutationResult>(
  request: NextRequest,
  options: MutationRouteOptions<TResult>,
): Promise<Response> {
  return handleAccessMutation(request, {
    ...options,
    errorResponse: memberApiError,
    internalCode: WorkspaceMemberErrorCode.Internal,
    permission: Permission.MembersManage,
    successResponse: (result) =>
      Response.json(
        { member: result.member },
        { status: options.successStatus },
      ),
    validationCode: WorkspaceMemberErrorCode.ValidationError,
  });
}

export function handleRoleMutation<TResult extends RoleMutationResult>(
  request: NextRequest,
  options: MutationRouteOptions<TResult>,
): Promise<Response> {
  return handleAccessMutation(request, {
    ...options,
    errorResponse: roleApiError,
    internalCode: RoleErrorCode.Internal,
    permission: Permission.RolesManage,
    successResponse: (result) =>
      Response.json({ role: result.role }, { status: options.successStatus }),
    validationCode: RoleErrorCode.ValidationError,
  });
}
