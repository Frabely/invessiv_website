import "server-only";

import type { NextRequest } from "next/server";

import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { can } from "@invessiv/common/patterns/auth/can";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

import { authApiError } from "./auth-api-error";
import { authenticateWorkspaceRequest } from "./workspace-authentication";

type WorkspaceApiHandler = (
  request: NextRequest,
  actor: WorkspaceActor,
) => Promise<Response>;

/** Resolves the actor or answers with JSON only — API routes never redirect. */
export function withWorkspaceApiActor(handler: WorkspaceApiHandler) {
  return async (request: NextRequest): Promise<Response> => {
    const authentication = await authenticateWorkspaceRequest();

    if (authentication.status === WorkspaceAuthStatus.Authorized) {
      return handler(request, authentication.actor);
    }
    if (authentication.status === WorkspaceAuthStatus.Unauthenticated) {
      return authApiError(
        AuthErrorCode.Unauthorized,
        HttpResponseCode.Unauthorized,
      );
    }
    if (authentication.status === WorkspaceAuthStatus.NotMember) {
      return authApiError(AuthErrorCode.NotFound, HttpResponseCode.NotFound);
    }
    if (authentication.status === WorkspaceAuthStatus.Inactive) {
      return authApiError(AuthErrorCode.Forbidden, HttpResponseCode.Forbidden);
    }

    return authApiError(
      AuthErrorCode.Unavailable,
      HttpResponseCode.ServiceUnavailable,
    );
  };
}

export function withPermission(
  permission: Permission,
  handler: WorkspaceApiHandler,
) {
  return withWorkspaceApiActor(async (request, actor) => {
    if (!can(actor, permission)) {
      return authApiError(AuthErrorCode.Forbidden, HttpResponseCode.Forbidden);
    }

    return handler(request, actor);
  });
}
