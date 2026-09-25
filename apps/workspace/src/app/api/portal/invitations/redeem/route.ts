import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";
import { readJsonBody } from "@/lib/http/read-json-body";
import { redeemPortalInvitation } from "@/server/portal/command-handler/redeem-portal-invitation.command-handler";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { code: PortalInvitationErrorCode.Unauthenticated },
      { status: HttpResponseCode.Unauthorized },
    );
  }

  const parsed = await readJsonBody(request);
  let token = "";
  if (
    parsed.ok &&
    typeof parsed.body === "object" &&
    parsed.body !== null &&
    "token" in parsed.body &&
    typeof parsed.body.token === "string"
  ) {
    token = parsed.body.token;
  }
  const user = await currentUser();
  if (!user) {
    return Response.json(
      { code: PortalInvitationErrorCode.Unauthenticated },
      { status: HttpResponseCode.Unauthorized },
    );
  }

  try {
    const result = await redeemPortalInvitation(token, {
      id: userId,
      primaryEmail: user.primaryEmailAddress?.emailAddress ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        "Portal user",
    });
    return Response.json(result, {
      status: result.ok ? HttpResponseCode.Ok : HttpResponseCode.NotFound,
    });
  } catch {
    return Response.json(
      { code: PortalInvitationErrorCode.Unavailable },
      { status: HttpResponseCode.ServiceUnavailable },
    );
  }
}
