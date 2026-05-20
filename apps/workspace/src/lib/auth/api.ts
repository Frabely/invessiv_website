import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { WorkspaceAccess } from "./permissions";
import { isEmailAllowed } from "./allowlist";
import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { authApiError } from "./auth-api-error";

type WorkspaceApiHandler = (
  request: NextRequest,
  access: WorkspaceAccess,
) => Promise<Response>;

export function withWorkspaceApiAuth(handler: WorkspaceApiHandler) {
  return async (request: NextRequest): Promise<Response> => {
    const { userId } = await auth();

    if (!userId) {
      return authApiError(
        AuthErrorCode.Unauthorized,
        HttpResponseCode.Unauthorized,
      );
    }

    const user = await currentUser();
    const primaryEmail = user?.emailAddresses.find(
      (entry) => entry.id === user.primaryEmailAddressId,
    )?.emailAddress;

    if (!primaryEmail) {
      return authApiError(
        AuthErrorCode.Unauthorized,
        HttpResponseCode.Unauthorized,
      );
    }

    if (!isEmailAllowed(primaryEmail)) {
      return authApiError(AuthErrorCode.NotFound, HttpResponseCode.NotFound);
    }

    return handler(request, { userId, email: primaryEmail });
  };
}
