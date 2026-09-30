import "server-only";

import type { NextRequest } from "next/server";

import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { withJsonBody } from "@/lib/http/with-json-body";
import {
  feedbackRoundApiError,
  privateFeedbackRoundResponse,
} from "@/lib/workspace/crm/feedback-round-api-error";
import { markFeedbackRoundRead } from "@/server/workspace/crm/command-handler/mark-feedback-round-read.command-handler";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ roundId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { roundId } = await params;
  return privateFeedbackRoundResponse(CrmOperation.MarkFeedbackRoundRead, () =>
    withCrmPermission(
      CrmEndpointAccessRule.FeedbackRoundRead,
      (authorizedRequest, actor) =>
        withJsonBody(
          authorizedRequest,
          async (body) => {
            const parsed = feedbackRoundSchemas.markRead.safeParse(body);
            if (!parsed.success)
              return feedbackRoundApiError(
                FeedbackRoundErrorCode.ValidationError,
              );
            const result = await markFeedbackRoundRead(
              roundId,
              parsed.data,
              actor,
            );
            return result.ok
              ? Response.json(
                  { marked: result.marked },
                  { status: HttpResponseCode.Ok },
                )
              : feedbackRoundApiError(result.code);
          },
          () => feedbackRoundApiError(FeedbackRoundErrorCode.ValidationError),
        ),
    )(request),
  );
}
