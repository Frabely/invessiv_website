import "server-only";

import type { NextRequest } from "next/server";

import type { AttachPortalOnboardingFileRequestDto } from "@invessiv/common/contracts/portal/attach-portal-onboarding-file-request.dto";
import {
  portalOnboardingWriteResponse,
  privatePortalOnboardingResponse,
  withPortalOnboardingBody,
} from "@/lib/portal/portal-onboarding-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { attachPortalOnboardingFile } from "@/server/portal/command-handler/attach-portal-onboarding-file.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; formId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, formId } = await params;
  return privatePortalOnboardingResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalOnboardingBody<AttachPortalOnboardingFileRequestDto>(
        authorized,
        async (body) =>
          portalOnboardingWriteResponse(
            actor,
            await attachPortalOnboardingFile(actor, formId.toLowerCase(), body),
          ),
      ),
    )(request),
  );
}
