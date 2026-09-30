import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import {
  feedbackRoundApiError,
  privateFeedbackRoundResponse,
} from "@/lib/workspace/crm/feedback-round-api-error";
import { markFeedbackRoundRead } from "@/server/workspace/crm/command-handler/mark-feedback-round-read.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ roundId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { roundId } = await params;
  return privateFeedbackRoundResponse(CrmOperation.MarkFeedbackRoundRead, () =>
    withCrmPermission(
      CrmEndpointAccessRule.FeedbackRoundRead,
      async (_, actor) => {
        const result = await markFeedbackRoundRead(roundId, actor);
        return result.ok
          ? Response.json(
              { marked: result.marked },
              { status: HttpResponseCode.Ok },
            )
          : feedbackRoundApiError(result.code);
      },
    )(request),
  );
}
