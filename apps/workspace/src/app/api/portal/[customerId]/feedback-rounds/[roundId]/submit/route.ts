import "server-only";

import type { NextRequest } from "next/server";

import type { SubmitPortalFeedbackRoundRequestDto } from "@invessiv/common/contracts/portal/submit-portal-feedback-round-request.dto";
import {
  portalFeedbackApiResponse,
  privatePortalFeedbackResponse,
  withPortalFeedbackBody,
} from "@/lib/portal/portal-feedback-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { submitPortalFeedbackRound } from "@/server/portal/command-handler/submit-portal-feedback-round.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; roundId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, roundId } = await params;
  return privatePortalFeedbackResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalFeedbackBody<SubmitPortalFeedbackRoundRequestDto>(
        authorized,
        async (body) =>
          portalFeedbackApiResponse(
            await submitPortalFeedbackRound(actor, roundId.toLowerCase(), body),
          ),
      ),
    )(request),
  );
}
