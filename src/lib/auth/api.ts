import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

import type { WorkspaceAccess } from "./permissions";
import { isEmailAllowed } from "./allowlist";
import { AuthErrorCode } from "@/common/constants/auth/auth-error-codes";
import { authApiError } from "./auth-api-error";

type WorkspaceApiHandler = (
  request: NextRequest,
  access: WorkspaceAccess,
) => Promise<Response>;

export function withWorkspaceApiAuth(handler: WorkspaceApiHandler) {
  return async (request: NextRequest): Promise<Response> => {
    const { userId } = await auth();

    if (!userId) {
      return authApiError(AuthErrorCode.Unauthorized, 401);
    }

    const user = await currentUser();
    const primaryEmail = user?.emailAddresses.find(
      (entry) => entry.id === user.primaryEmailAddressId,
    )?.emailAddress;

    if (!primaryEmail) {
      return authApiError(AuthErrorCode.Unauthorized, 401);
    }

    if (!isEmailAllowed(primaryEmail)) {
      return authApiError(AuthErrorCode.NotFound, 404);
    }

    return handler(request, { userId, email: primaryEmail });
  };
}
