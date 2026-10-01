import "server-only";

import type { NextRequest } from "next/server";

import {
  portalOnboardingApiResponse,
  privatePortalOnboardingResponse,
} from "@/lib/portal/portal-onboarding-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { detachPortalOnboardingFile } from "@/server/portal/command-handler/detach-portal-onboarding-file.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    customerId: string;
    formId: string;
    answerFileId: string;
  }>;
};

/** Addresses the link, not the file: the same file may hang on a second form. */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { customerId, formId, answerFileId } = await params;
  return privatePortalOnboardingResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (_authorized, actor) =>
      portalOnboardingApiResponse(
        await detachPortalOnboardingFile(actor, {
          formId: formId.toLowerCase(),
          answerFileId: answerFileId.toLowerCase(),
        }),
      ),
    )(request),
  );
}
