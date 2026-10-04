import "server-only";

import type { NextRequest } from "next/server";

import type { AddPortalOnboardingGroupEntryRequestDto } from "@invessiv/common/contracts/portal/add-portal-onboarding-group-entry-request.dto";
import {
  portalOnboardingWriteResponse,
  privatePortalOnboardingResponse,
  withPortalOnboardingBody,
} from "@/lib/portal/portal-onboarding-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { addPortalOnboardingGroupEntry } from "@/server/portal/command-handler/add-portal-onboarding-group-entry.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; formId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, formId } = await params;
  return privatePortalOnboardingResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalOnboardingBody<AddPortalOnboardingGroupEntryRequestDto>(
        authorized,
        async (body) =>
          portalOnboardingWriteResponse(
            actor,
            await addPortalOnboardingGroupEntry(
              actor,
              formId.toLowerCase(),
              body,
            ),
          ),
      ),
    )(request),
  );
}
