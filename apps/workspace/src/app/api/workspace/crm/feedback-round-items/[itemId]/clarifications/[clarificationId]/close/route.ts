import "server-only";

import type { NextRequest } from "next/server";

import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { CloseFeedbackItemClarificationRequestDto } from "@invessiv/common/contracts/crm/close-feedback-item-clarification-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  feedbackRoundApiError,
  feedbackItemApiResponse,
  privateFeedbackRoundResponse,
} from "@/lib/workspace/crm/feedback-round-api-error";
import { closeFeedbackItemClarification } from "@/server/workspace/crm/command-handler/close-feedback-item-clarification.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ itemId: string; clarificationId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { itemId, clarificationId } = await params;
  return privateFeedbackRoundResponse(
    CrmOperation.CloseFeedbackItemClarification,
    () =>
      withCrmPermission(
        CrmEndpointAccessRule.FeedbackItemClarificationClose,
        (authorizedRequest, actor) =>
          withJsonBody(
            authorizedRequest,
            async (body) =>
              // The command validates the body against its schema before using it.
              feedbackItemApiResponse(
                await closeFeedbackItemClarification(
                  itemId,
                  clarificationId,
                  body as CloseFeedbackItemClarificationRequestDto,
                  actor,
                ),
              ),
            () => feedbackRoundApiError(FeedbackRoundErrorCode.ValidationError),
          ),
      )(request),
  );
}
