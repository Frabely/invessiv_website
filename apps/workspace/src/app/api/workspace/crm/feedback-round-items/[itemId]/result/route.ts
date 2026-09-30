import "server-only";

import type { NextRequest } from "next/server";

import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { SetFeedbackItemResultRequestDto } from "@invessiv/common/contracts/crm/set-feedback-item-result-request.dto";
import type { SetFeedbackItemResultResult } from "@invessiv/common/contracts/crm/results/set-feedback-item-result-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  feedbackRoundApiError,
  privateFeedbackRoundResponse,
} from "@/lib/workspace/crm/feedback-round-api-error";
import { setFeedbackItemResult } from "@/server/workspace/crm/command-handler/set-feedback-item-result.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ itemId: string }> };

function resultResponse(result: SetFeedbackItemResultResult): Response {
  if (result.ok)
    return Response.json(result.item, { status: HttpResponseCode.Ok });
  if ("conflict" in result)
    return Response.json(result.conflict, {
      status: HttpResponseCode.Conflict,
    });
  if (result.code === FeedbackRoundErrorCode.ValidationError)
    return feedbackRoundApiError(result.code, { details: result.errors });
  return feedbackRoundApiError(result.code);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { itemId } = await params;
  return privateFeedbackRoundResponse(CrmOperation.SetFeedbackItemResult, () =>
    withCrmPermission(
      CrmEndpointAccessRule.FeedbackItemResult,
      (authorizedRequest, actor) =>
        withJsonBody(
          authorizedRequest,
          async (body) =>
            // The command validates the body against its schema before using it.
            resultResponse(
              await setFeedbackItemResult(
                itemId,
                body as SetFeedbackItemResultRequestDto,
                actor,
              ),
            ),
          () => feedbackRoundApiError(FeedbackRoundErrorCode.ValidationError),
        ),
    )(request),
  );
}
