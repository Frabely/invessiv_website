import "server-only";

import type { NextRequest } from "next/server";

import {
  portalOnboardingWriteResponse,
  privatePortalOnboardingResponse,
} from "@/lib/portal/portal-onboarding-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { removePortalOnboardingGroupEntry } from "@/server/portal/command-handler/remove-portal-onboarding-group-entry.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; formId: string; entryId: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { customerId, formId, entryId } = await params;
  return privatePortalOnboardingResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (_authorized, actor) =>
      portalOnboardingWriteResponse(
        actor,
        await removePortalOnboardingGroupEntry(actor, {
          formId: formId.toLowerCase(),
          entryId: entryId.toLowerCase(),
        }),
      ),
    )(request),
  );
}
