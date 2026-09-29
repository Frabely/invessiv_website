import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { AttachPortalFeedbackFileRequestDto } from "@invessiv/common/contracts/portal/attach-portal-feedback-file-request.dto";
import {
  portalFeedbackApiResponse,
  privatePortalFeedbackResponse,
  withPortalFeedbackBody,
} from "@/lib/portal/portal-feedback-api-response";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { attachPortalFeedbackFile } from "@/server/portal/command-handler/attach-portal-feedback-file.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; roundId: string; itemId: string }>;
};

/** Uploading itself runs through the portal file routes; this only hangs the finished file on the item. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { customerId, roundId, itemId } = await params;
  return privatePortalFeedbackResponse(() =>
    withPortalActor(customerId.toLowerCase(), (authorized, actor) =>
      withPortalFeedbackBody<AttachPortalFeedbackFileRequestDto>(
        authorized,
        async (body) =>
          portalFeedbackApiResponse(
            await attachPortalFeedbackFile(
              actor,
              { roundId: roundId.toLowerCase(), itemId },
              body,
            ),
            HttpResponseCode.Created,
          ),
      ),
    )(request),
  );
}
