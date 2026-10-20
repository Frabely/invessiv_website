import "server-only";

import type { NextRequest } from "next/server";

import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { SetFeedbackItemResultRequestDto } from "@invessiv/common/contracts/crm/set-feedback-item-result-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  feedbackRoundApiError,
  feedbackItemApiResponse,
  privateFeedbackRoundResponse,
} from "@/lib/workspace/crm/feedback-round-api-error";
import { setFeedbackItemResult } from "@/server/workspace/crm/command-handler/set-feedback-item-result.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ itemId: string }> };

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
            feedbackItemApiResponse(
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
