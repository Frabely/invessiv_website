import "server-only";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateMemberBookingUrlRequestDto } from "@invessiv/common/contracts/auth/update-member-booking-url-request.dto";
import type { UpdateMemberBookingUrlResult } from "@invessiv/common/contracts/auth/results/update-member-booking-url-result";
import { AccessOperation } from "@/common/constants/access/access-operations";
import { withWorkspaceApiActor } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logAccessFailure } from "@/lib/workspace/access/log-access-failure";
import { memberApiError } from "@/lib/workspace/access/member-api-error";
import { updateMemberBookingUrl } from "@/server/workspace/access/command-handler/update-member-booking-url.command-handler";
import { getOwnBookingUrl } from "@/server/workspace/access/query-handler/get-own-booking-url.query-handler";
import { workspaceMemberMappingService } from "@/server/workspace/access/services/workspace-member-mapping-service";

export const runtime = "nodejs";

// Both methods address the member of the session and need no permission beyond an active
// membership. Answers carry `OwnBookingUrlDto`, never the member as the settings area sees it.

export const GET = withWorkspaceApiActor(async (_request, actor) => {
  try {
    const own = await getOwnBookingUrl(actor);
    return own
      ? Response.json(own, { status: HttpResponseCode.Ok })
      : memberApiError(WorkspaceMemberErrorCode.MemberNotFound);
  } catch (error: unknown) {
    logAccessFailure(AccessOperation.GetOwnBookingUrl, error);
    return memberApiError(WorkspaceMemberErrorCode.Internal);
  }
});

export const PATCH = withWorkspaceApiActor(async (request, actor) => {
  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    return memberApiError(WorkspaceMemberErrorCode.ValidationError);
  }

  let result: UpdateMemberBookingUrlResult;
  try {
    // The command validates the body against its schema before using it.
    result = await updateMemberBookingUrl(
      actor.workspaceMemberId,
      parsed.body as UpdateMemberBookingUrlRequestDto,
      actor,
    );
  } catch (error: unknown) {
    logAccessFailure(AccessOperation.UpdateOwnBookingUrl, error);
    return memberApiError(WorkspaceMemberErrorCode.Internal);
  }

  if (result.ok) {
    return Response.json(
      workspaceMemberMappingService.mapMemberToOwnBookingUrl(result.member),
      { status: HttpResponseCode.Ok },
    );
  }
  if ("conflict" in result) {
    return Response.json(
      {
        ...result.conflict,
        current: workspaceMemberMappingService.mapMemberToOwnBookingUrl(
          result.conflict.current,
        ),
      },
      { status: HttpResponseCode.Conflict },
    );
  }
  return memberApiError(
    result.code,
    "errors" in result ? result.errors : undefined,
  );
});
