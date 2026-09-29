import "server-only";

import type { NextRequest } from "next/server";

import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import {
  feedbackRoundApiError,
  privateFeedbackRoundResponse,
} from "@/lib/workspace/crm/feedback-round-api-error";
import { getFeedbackRound } from "@/server/workspace/crm/query-handler/get-feedback-round.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ roundId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { roundId } = await params;
  return privateFeedbackRoundResponse(CrmOperation.GetFeedbackRound, () =>
    withCrmPermission(
      CrmEndpointAccessRule.FeedbackRoundDetail,
      async (_, actor) => {
        const round = await getFeedbackRound(roundId, actor);
        return round
          ? Response.json(round, { status: HttpResponseCode.Ok })
          : feedbackRoundApiError(FeedbackRoundErrorCode.RoundNotFound);
      },
    )(request),
  );
}
