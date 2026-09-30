import "server-only";

import type { NextRequest } from "next/server";

import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { ChangeFeedbackRoundStatusRequestDto } from "@invessiv/common/contracts/crm/change-feedback-round-status-request.dto";
import type { ChangeFeedbackRoundStatusResult } from "@invessiv/common/contracts/crm/results/change-feedback-round-status-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  feedbackRoundApiError,
  privateFeedbackRoundResponse,
} from "@/lib/workspace/crm/feedback-round-api-error";
import { changeFeedbackRoundStatus } from "@/server/workspace/crm/command-handler/change-feedback-round-status.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ roundId: string }> };

function statusResponse(result: ChangeFeedbackRoundStatusResult): Response {
  if (result.ok)
    return Response.json(result.round, { status: HttpResponseCode.Ok });
  if ("conflict" in result)
    return Response.json(result.conflict, {
      status: HttpResponseCode.Conflict,
    });
  if (result.code === FeedbackRoundErrorCode.ValidationError)
    return feedbackRoundApiError(result.code, { details: result.errors });
  return feedbackRoundApiError(result.code);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { roundId } = await params;
  return privateFeedbackRoundResponse(
    CrmOperation.ChangeFeedbackRoundStatus,
    () =>
      withCrmPermission(
        CrmEndpointAccessRule.FeedbackRoundStatusChange,
        (authorizedRequest, actor) =>
          withJsonBody(
            authorizedRequest,
            async (body) =>
              // The command validates the body against its schema before using it.
              statusResponse(
                await changeFeedbackRoundStatus(
                  roundId,
                  body as ChangeFeedbackRoundStatusRequestDto,
                  actor,
                ),
              ),
            () => feedbackRoundApiError(FeedbackRoundErrorCode.ValidationError),
          ),
      )(request),
  );
}
