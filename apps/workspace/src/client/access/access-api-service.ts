import {
  ROLE_ERROR_CODE_VALUES,
  RoleErrorCode,
} from "@invessiv/common/constants/auth/errors/role-error-codes";
import {
  WORKSPACE_MEMBER_ERROR_CODE_VALUES,
  WorkspaceMemberErrorCode,
} from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { AddWorkspaceMemberRequestDto } from "@invessiv/common/contracts/auth/add-workspace-member-request.dto";
import type { ChangeWorkspaceOwnerRequestDto } from "@invessiv/common/contracts/auth/change-workspace-owner-request.dto";
import type { ClerkCandidateDto } from "@invessiv/common/contracts/auth/clerk-candidate.dto";
import type { CreateRoleRequestDto } from "@invessiv/common/contracts/auth/create-role-request.dto";
import type { ReplaceWorkspaceMemberRolesRequestDto } from "@invessiv/common/contracts/auth/replace-workspace-member-roles-request.dto";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { UpdateRoleRequestDto } from "@invessiv/common/contracts/auth/update-role-request.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import type {
  ClerkCandidatesClientResult,
  MemberMutationClientResult,
  RoleMutationClientResult,
} from "@/common/contracts/access/access-client-results";
import {
  clerkCandidatesEndpoint,
  workspaceMemberOwnerEndpoint,
  workspaceMemberRolesEndpoint,
  workspaceRoleEndpoint,
} from "@/common/patterns/access/access-api-endpoints";

type ApiResponse = { ok: boolean; status: number; payload: unknown };

const CONFLICT_STATUS = 409;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function send(
  url: string,
  method: string,
  body?: unknown,
): Promise<ApiResponse | null> {
  try {
    const response = await fetch(url, {
      method,
      ...(body !== undefined
        ? {
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
          }
        : {}),
    });
    const payload = (await response.json().catch(() => null)) as unknown;
    return { ok: response.ok, status: response.status, payload };
  } catch {
    return null;
  }
}

function readErrorCode<TCode extends string>(
  payload: unknown,
  knownCodes: readonly TCode[],
  fallback: TCode,
): TCode {
  const error = isRecord(payload) ? payload.error : undefined;
  return knownCodes.find((code) => code === error) ?? fallback;
}

function readConflict<TCurrent>(response: ApiResponse): TCurrent | null {
  if (
    response.status === CONFLICT_STATUS &&
    isRecord(response.payload) &&
    response.payload.code === ConcurrencyErrorCode.VersionConflict &&
    isRecord(response.payload.current)
  ) {
    return response.payload.current as TCurrent;
  }
  return null;
}

async function mutateMember(
  url: string,
  method: string,
  body: unknown,
): Promise<MemberMutationClientResult> {
  const response = await send(url, method, body);
  if (!response) {
    return { ok: false, code: WorkspaceMemberErrorCode.Internal };
  }
  if (response.ok && isRecord(response.payload) && response.payload.member) {
    return {
      ok: true,
      member: response.payload.member as WorkspaceMemberDto,
    };
  }
  const current = readConflict<WorkspaceMemberDto>(response);
  if (current) {
    return { ok: false, code: ConcurrencyErrorCode.VersionConflict, current };
  }
  return {
    ok: false,
    code: readErrorCode(
      response.payload,
      WORKSPACE_MEMBER_ERROR_CODE_VALUES,
      WorkspaceMemberErrorCode.Internal,
    ),
  };
}

async function mutateRole(
  url: string,
  method: string,
  body: unknown,
): Promise<RoleMutationClientResult> {
  const response = await send(url, method, body);
  if (!response) {
    return { ok: false, code: RoleErrorCode.Internal };
  }
  if (response.ok && isRecord(response.payload) && response.payload.role) {
    return { ok: true, role: response.payload.role as RoleDto };
  }
  const current = readConflict<RoleDto>(response);
  if (current) {
    return { ok: false, code: ConcurrencyErrorCode.VersionConflict, current };
  }
  return {
    ok: false,
    code: readErrorCode(
      response.payload,
      ROLE_ERROR_CODE_VALUES,
      RoleErrorCode.Internal,
    ),
  };
}

async function listClerkCandidates(
  query: string,
): Promise<ClerkCandidatesClientResult> {
  const response = await send(clerkCandidatesEndpoint(query), "GET");
  if (!response) {
    return { ok: false, code: WorkspaceMemberErrorCode.Internal };
  }
  if (
    response.ok &&
    isRecord(response.payload) &&
    Array.isArray(response.payload.candidates)
  ) {
    return {
      ok: true,
      candidates: response.payload.candidates as ClerkCandidateDto[],
    };
  }
  return {
    ok: false,
    code: readErrorCode(
      response.payload,
      WORKSPACE_MEMBER_ERROR_CODE_VALUES,
      WorkspaceMemberErrorCode.Internal,
    ),
  };
}

export const accessApiService = {
  addMember: (request: AddWorkspaceMemberRequestDto) =>
    mutateMember(WorkspaceApiEndpoint.Members, "POST", request),
  replaceMemberRoles: (
    memberId: string,
    request: ReplaceWorkspaceMemberRolesRequestDto,
  ) => mutateMember(workspaceMemberRolesEndpoint(memberId), "PUT", request),
  grantOwner: (memberId: string, request: ChangeWorkspaceOwnerRequestDto) =>
    mutateMember(workspaceMemberOwnerEndpoint(memberId), "POST", request),
  revokeOwner: (memberId: string, request: ChangeWorkspaceOwnerRequestDto) =>
    mutateMember(workspaceMemberOwnerEndpoint(memberId), "DELETE", request),
  createRole: (request: CreateRoleRequestDto) =>
    mutateRole(WorkspaceApiEndpoint.Roles, "POST", request),
  updateRole: (roleId: string, request: UpdateRoleRequestDto) =>
    mutateRole(workspaceRoleEndpoint(roleId), "PATCH", request),
  listClerkCandidates,
} as const;
