import "server-only";

import type { NextRequest } from "next/server";

import type { AnswerPortalFeedbackClarificationRequestDto } from "@invessiv/common/contracts/portal/answer-portal-feedback-clarification-request.dto";
import {
  portalFeedbackWriteResponse,
  privatePortalFeedbackResponse,
  withPortalFeedbackBody,
} from "@/lib/portal/portal-feedback-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { answerPortalFeedbackClarification } from "@/server/portal/command-handler/answer-portal-feedback-clarification.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    customerId: string;
    roundId: string;
    itemId: string;
    clarificationId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, roundId, itemId, clarificationId } = await params;
  return privatePortalFeedbackResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalFeedbackBody<AnswerPortalFeedbackClarificationRequestDto>(
        authorized,
        async (body) =>
          portalFeedbackWriteResponse(
            actor,
            await answerPortalFeedbackClarification(
              actor,
              roundId.toLowerCase(),
              itemId.toLowerCase(),
              clarificationId.toLowerCase(),
              body,
            ),
          ),
      ),
    )(request),
  );
}
