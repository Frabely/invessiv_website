import "server-only";

import type { NextRequest } from "next/server";

import type { SavePortalFeedbackDraftRequestDto } from "@invessiv/common/contracts/portal/save-portal-feedback-draft-request.dto";
import {
  portalFeedbackApiResponse,
  privatePortalFeedbackResponse,
  withPortalFeedbackBody,
} from "@/lib/portal/portal-feedback-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { savePortalFeedbackDraft } from "@/server/portal/command-handler/save-portal-feedback-draft.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; roundId: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { customerId, roundId } = await params;
  return privatePortalFeedbackResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalFeedbackBody<SavePortalFeedbackDraftRequestDto>(
        authorized,
        async (body) =>
          portalFeedbackApiResponse(
            await savePortalFeedbackDraft(actor, roundId.toLowerCase(), body),
          ),
      ),
    )(request),
  );
}
