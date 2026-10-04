import "server-only";

import type { NextRequest } from "next/server";

import type { ApprovePortalFeedbackRequestDto } from "@invessiv/common/contracts/portal/approve-portal-feedback-request.dto";
import {
  portalFeedbackWriteResponse,
  privatePortalFeedbackResponse,
  withPortalFeedbackBody,
} from "@/lib/portal/portal-feedback-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { approvePortalFeedback } from "@/server/portal/command-handler/approve-portal-feedback.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; roundId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, roundId } = await params;
  return privatePortalFeedbackResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalFeedbackBody<ApprovePortalFeedbackRequestDto>(
        authorized,
        async (body) =>
          portalFeedbackWriteResponse(
            actor,
            await approvePortalFeedback(actor, roundId.toLowerCase(), body),
          ),
      ),
    )(request),
  );
}
