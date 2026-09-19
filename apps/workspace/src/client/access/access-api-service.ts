import {
  ROLE_ERROR_CODE_VALUES,
  RoleErrorCode,
} from "@invessiv/common/constants/auth/errors/role-error-codes";
import {
  WORKSPACE_MEMBER_ERROR_CODE_VALUES,
  WorkspaceMemberErrorCode,
} from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import type { AddWorkspaceMemberRequestDto } from "@invessiv/common/contracts/auth/add-workspace-member-request.dto";
import type { ChangeWorkspaceOwnerRequestDto } from "@invessiv/common/contracts/auth/change-workspace-owner-request.dto";
import type { GrantAccessScopeRequestDto } from "@invessiv/common/contracts/auth/grant-access-scope-request.dto";
import type { RevokeAccessScopeRequestDto } from "@invessiv/common/contracts/auth/revoke-access-scope-request.dto";
import type { WorkspaceMemberAccessScopeDto } from "@invessiv/common/contracts/auth/workspace-member-access-scope.dto";
import type { AccessScopeEntryDto } from "@invessiv/common/contracts/auth/access-scope-entry.dto";
import type { AccessCustomerOptionDto } from "@invessiv/common/contracts/auth/access-customer-option.dto";
import type { AccessProjectOptionDto } from "@invessiv/common/contracts/auth/access-project-option.dto";
import type { ClerkCandidateDto } from "@invessiv/common/contracts/auth/clerk-candidate.dto";
import type { CreateRoleRequestDto } from "@invessiv/common/contracts/auth/create-role-request.dto";
import type { ListClerkCandidatesRequestDto } from "@invessiv/common/contracts/auth/list-clerk-candidates-request.dto";
import type { ReplaceWorkspaceMemberRolesRequestDto } from "@invessiv/common/contracts/auth/replace-workspace-member-roles-request.dto";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { UpdateRoleRequestDto } from "@invessiv/common/contracts/auth/update-role-request.dto";
import type { UpdateWorkspaceMemberStatusRequestDto } from "@invessiv/common/contracts/auth/update-workspace-member-status-request.dto";
import { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import type {
  AccessCustomerListClientResult,
  AccessProjectListClientResult,
  AccessScopeListClientResult,
  AccessScopeMutationClientResult,
  ClerkCandidatesClientResult,
  MemberMutationClientResult,
  MemberStatusMutationClientResult,
  RoleMutationClientResult,
} from "@/common/contracts/access/access-client-results";
import {
  accessCustomerProjectsEndpoint,
  accessCustomersEndpoint,
  crmCustomerAccessScopesEndpoint,
  workspaceMemberAccessScopeEndpoint,
  workspaceMemberAccessScopesEndpoint,
  workspaceMemberEndpoint,
  workspaceMemberOwnerEndpoint,
  workspaceMemberRolesEndpoint,
  workspaceRoleEndpoint,
} from "@/common/patterns/access/access-api-endpoints";

type ApiResponse = { ok: boolean; status: number; payload: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function send(
  url: string,
  method: HttpMethod,
  body?: unknown,
): Promise<ApiResponse | null> {
  try {
    const response = await fetch(url, {
      method,
      ...(body !== undefined
        ? {
            body: JSON.stringify(body),
            headers: { [HttpHeaderName.ContentType]: MediaType.Json },
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
    response.status === HttpResponseCode.Conflict &&
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
  method: HttpMethod,
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

async function mutateAccessScope(
  url: string,
  method: HttpMethod,
  body: GrantAccessScopeRequestDto | RevokeAccessScopeRequestDto,
): Promise<AccessScopeMutationClientResult> {
  const response = await send(url, method, body);
  if (!response) {
    return { ok: false, code: WorkspaceMemberErrorCode.Internal };
  }
  if (response.ok && isRecord(response.payload) && response.payload.member) {
    return {
      ok: true,
      member: response.payload.member as WorkspaceMemberDto,
      ...(response.payload.accessScope
        ? {
            accessScope: response.payload
              .accessScope as WorkspaceMemberAccessScopeDto,
          }
        : {}),
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

async function readCollection<TItem>(
  url: string,
  key: string,
): Promise<TItem[] | null> {
  const response = await send(url, HttpMethod.Get);
  if (!response?.ok || !isRecord(response.payload)) {
    return null;
  }
  const value = response.payload[key];
  return Array.isArray(value) ? (value as TItem[]) : null;
}

function readResponsibilityCounts(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.details)) {
    return undefined;
  }
  const counts = payload.details.responsibilityCounts;
  const customerCount = isRecord(counts)
    ? counts[OwnableEntity.Customer]
    : undefined;
  if (typeof customerCount !== "number") {
    return undefined;
  }
  return { [OwnableEntity.Customer]: customerCount };
}

async function updateMemberStatus(
  memberId: string,
  request: UpdateWorkspaceMemberStatusRequestDto,
): Promise<MemberStatusMutationClientResult> {
  const response = await send(
    workspaceMemberEndpoint(memberId),
    HttpMethod.Patch,
    request,
  );
  if (!response) {
    return { ok: false, code: WorkspaceMemberErrorCode.Internal };
  }
  if (response.ok && isRecord(response.payload) && response.payload.member) {
    return { ok: true, member: response.payload.member as WorkspaceMemberDto };
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
    responsibilityCounts: readResponsibilityCounts(response.payload),
  };
}

async function mutateRole(
  url: string,
  method: HttpMethod,
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
  request: ListClerkCandidatesRequestDto,
): Promise<ClerkCandidatesClientResult> {
  const response = await send(
    WorkspaceApiEndpoint.MembersClerkCandidates,
    HttpMethod.Post,
    request,
  );
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
    mutateMember(WorkspaceApiEndpoint.Members, HttpMethod.Post, request),
  updateMemberStatus,
  replaceMemberRoles: (
    memberId: string,
    request: ReplaceWorkspaceMemberRolesRequestDto,
  ) =>
    mutateMember(
      workspaceMemberRolesEndpoint(memberId),
      HttpMethod.Put,
      request,
    ),
  grantOwner: (memberId: string, request: ChangeWorkspaceOwnerRequestDto) =>
    mutateMember(
      workspaceMemberOwnerEndpoint(memberId),
      HttpMethod.Post,
      request,
    ),
  revokeOwner: (memberId: string, request: ChangeWorkspaceOwnerRequestDto) =>
    mutateMember(
      workspaceMemberOwnerEndpoint(memberId),
      HttpMethod.Delete,
      request,
    ),
  createRole: (request: CreateRoleRequestDto) =>
    mutateRole(WorkspaceApiEndpoint.Roles, HttpMethod.Post, request),
  updateRole: (roleId: string, request: UpdateRoleRequestDto) =>
    mutateRole(workspaceRoleEndpoint(roleId), HttpMethod.Patch, request),
  listClerkCandidates,
  async listMemberAccessScopes(
    memberId: string,
  ): Promise<AccessScopeListClientResult> {
    const accessScopes = await readCollection<AccessScopeEntryDto>(
      workspaceMemberAccessScopesEndpoint(memberId),
      "accessScopes",
    );
    return accessScopes
      ? { ok: true, accessScopes }
      : { ok: false, code: WorkspaceMemberErrorCode.Internal };
  },
  grantAccessScope: (memberId: string, request: GrantAccessScopeRequestDto) =>
    mutateAccessScope(
      workspaceMemberAccessScopesEndpoint(memberId),
      HttpMethod.Post,
      request,
    ),
  revokeAccessScope: (
    memberId: string,
    scopeId: string,
    request: RevokeAccessScopeRequestDto,
  ) =>
    mutateAccessScope(
      workspaceMemberAccessScopeEndpoint(memberId, scopeId),
      HttpMethod.Delete,
      request,
    ),
  async listCustomerAccessScopes(
    customerId: string,
  ): Promise<AccessScopeListClientResult> {
    const accessScopes = await readCollection<AccessScopeEntryDto>(
      crmCustomerAccessScopesEndpoint(customerId),
      "accessScopes",
    );
    return accessScopes
      ? { ok: true, accessScopes }
      : { ok: false, code: WorkspaceMemberErrorCode.Internal };
  },
  async listAccessCustomers(
    query: string,
  ): Promise<AccessCustomerListClientResult> {
    const customers = await readCollection<AccessCustomerOptionDto>(
      accessCustomersEndpoint(query),
      "customers",
    );
    return customers
      ? { ok: true, customers }
      : { ok: false, code: WorkspaceMemberErrorCode.Internal };
  },
  async listAccessCustomerProjects(
    customerId: string,
  ): Promise<AccessProjectListClientResult> {
    const projects = await readCollection<AccessProjectOptionDto>(
      accessCustomerProjectsEndpoint(customerId),
      "projects",
    );
    return projects
      ? { ok: true, projects }
      : { ok: false, code: WorkspaceMemberErrorCode.Internal };
  },
} as const;
