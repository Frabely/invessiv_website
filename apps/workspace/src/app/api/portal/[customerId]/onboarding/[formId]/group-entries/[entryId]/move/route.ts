import "server-only";

import type { NextRequest } from "next/server";

import type { MovePortalOnboardingGroupEntryRequestDto } from "@invessiv/common/contracts/portal/move-portal-onboarding-group-entry-request.dto";
import {
  portalOnboardingApiResponse,
  privatePortalOnboardingResponse,
  withPortalOnboardingBody,
} from "@/lib/portal/portal-onboarding-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { movePortalOnboardingGroupEntry } from "@/server/portal/command-handler/move-portal-onboarding-group-entry.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; formId: string; entryId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, formId, entryId } = await params;
  return privatePortalOnboardingResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalOnboardingBody<MovePortalOnboardingGroupEntryRequestDto>(
        authorized,
        async (body) =>
          portalOnboardingApiResponse(
            await movePortalOnboardingGroupEntry(
              actor,
              {
                formId: formId.toLowerCase(),
                entryId: entryId.toLowerCase(),
              },
              body,
            ),
          ),
      ),
    )(request),
  );
}
