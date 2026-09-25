import "server-only";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { portalAccessApiError } from "@/lib/workspace/crm/portal-access-api-error";
import type { updatePortalMembershipNotifications } from "@/server/workspace/crm/command-handler/update-portal-membership-notifications.command-handler";

type MembershipUpdateResult = Awaited<
  ReturnType<typeof updatePortalMembershipNotifications>
>;

export function membershipUpdateResponse(
  result: MembershipUpdateResult,
): Response {
  if (result.ok) {
    return Response.json(
      { membership: result.membership },
      { status: HttpResponseCode.Ok },
    );
  }
  if (result.code === ConcurrencyErrorCode.VersionConflict) {
    return Response.json(result.conflict, {
      status: HttpResponseCode.Conflict,
    });
  }

  return portalAccessApiError(result.code);
}
