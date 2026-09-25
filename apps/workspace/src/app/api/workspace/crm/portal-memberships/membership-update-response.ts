import "server-only";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { updatePortalMembership } from "@/server/workspace/crm/command-handler/update-portal-membership.command-handler";

type MembershipUpdateResult = Awaited<
  ReturnType<typeof updatePortalMembership>
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

  const status =
    result.code === PortalAccessErrorCode.NotFound
      ? HttpResponseCode.NotFound
      : HttpResponseCode.BadRequest;
  return Response.json({ code: result.code }, { status });
}
