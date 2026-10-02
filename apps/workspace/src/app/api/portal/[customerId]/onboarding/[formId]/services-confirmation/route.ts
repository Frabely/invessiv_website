import "server-only";

import type { NextRequest } from "next/server";

import type { ConfirmPortalOnboardingServicesRequestDto } from "@invessiv/common/contracts/portal/confirm-portal-onboarding-services-request.dto";
import {
  portalOnboardingApiResponse,
  privatePortalOnboardingResponse,
  withPortalOnboardingBody,
} from "@/lib/portal/portal-onboarding-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { confirmPortalOnboardingServices } from "@/server/portal/command-handler/confirm-portal-onboarding-services.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; formId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, formId } = await params;
  return privatePortalOnboardingResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalOnboardingBody<ConfirmPortalOnboardingServicesRequestDto>(
        authorized,
        async (body) =>
          portalOnboardingApiResponse(
            await confirmPortalOnboardingServices(
              actor,
              formId.toLowerCase(),
              body,
            ),
          ),
      ),
    )(request),
  );
}
