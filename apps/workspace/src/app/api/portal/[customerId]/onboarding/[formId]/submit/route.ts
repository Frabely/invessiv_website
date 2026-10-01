import "server-only";

import type { NextRequest } from "next/server";

import {
  portalOnboardingApiResponse,
  privatePortalOnboardingResponse,
} from "@/lib/portal/portal-onboarding-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { submitPortalOnboarding } from "@/server/portal/command-handler/submit-portal-onboarding.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; formId: string }>;
};

/** Submitting carries no body: what is submitted is what the server holds under the form lock. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, formId } = await params;
  return privatePortalOnboardingResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (_authorized, actor) =>
      portalOnboardingApiResponse(
        await submitPortalOnboarding(actor, formId.toLowerCase()),
      ),
    )(request),
  );
}
