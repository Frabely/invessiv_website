import "server-only";

import type { NextRequest } from "next/server";

import type { SavePortalOnboardingAnswerRequestDto } from "@invessiv/common/contracts/portal/save-portal-onboarding-answer-request.dto";
import {
  portalOnboardingApiResponse,
  privatePortalOnboardingResponse,
  withPortalOnboardingBody,
} from "@/lib/portal/portal-onboarding-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { savePortalOnboardingAnswer } from "@/server/portal/command-handler/save-portal-onboarding-answer.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; formId: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { customerId, formId } = await params;
  return privatePortalOnboardingResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalOnboardingBody<SavePortalOnboardingAnswerRequestDto>(
        authorized,
        async (body) =>
          portalOnboardingApiResponse(
            await savePortalOnboardingAnswer(actor, formId.toLowerCase(), body),
          ),
      ),
    )(request),
  );
}
