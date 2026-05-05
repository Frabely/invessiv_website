import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

import type { WorkspaceAccess } from "./permissions";
import { isEmailAllowed } from "./allowlist";

type WorkspaceApiHandler = (
  request: NextRequest,
  access: WorkspaceAccess,
) => Promise<Response>;

export function withWorkspaceApiAuth(handler: WorkspaceApiHandler) {
  return async (request: NextRequest): Promise<Response> => {
    const { userId } = await auth();

    if (!userId) {
      return Response.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const user = await currentUser();
    const primaryEmail = user?.emailAddresses.find(
      (entry) => entry.id === user.primaryEmailAddressId,
    )?.emailAddress;

    if (!primaryEmail) {
      return Response.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (!isEmailAllowed(primaryEmail)) {
      return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    return handler(request, { userId, email: primaryEmail });
  };
}
