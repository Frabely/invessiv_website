import "server-only";

import type { NextRequest } from "next/server";

import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { AskFeedbackItemClarificationRequestDto } from "@invessiv/common/contracts/crm/ask-feedback-item-clarification-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  feedbackRoundApiError,
  feedbackItemApiResponse,
  privateFeedbackRoundResponse,
} from "@/lib/workspace/crm/feedback-round-api-error";
import { askFeedbackItemClarification } from "@/server/workspace/crm/command-handler/ask-feedback-item-clarification.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { itemId } = await params;
  return privateFeedbackRoundResponse(
    CrmOperation.AskFeedbackItemClarification,
    () =>
      withCrmPermission(
        CrmEndpointAccessRule.FeedbackItemClarificationAsk,
        (authorizedRequest, actor) =>
          withJsonBody(
            authorizedRequest,
            async (body) =>
              // The command validates the body against its schema before using it.
              feedbackItemApiResponse(
                await askFeedbackItemClarification(
                  itemId,
                  body as AskFeedbackItemClarificationRequestDto,
                  actor,
                ),
              ),
            () => feedbackRoundApiError(FeedbackRoundErrorCode.ValidationError),
          ),
      )(request),
  );
}
