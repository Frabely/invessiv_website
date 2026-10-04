import "server-only";

import type { NextRequest } from "next/server";

import {
  portalFeedbackWriteResponse,
  privatePortalFeedbackResponse,
} from "@/lib/portal/portal-feedback-api-error";
import { withPortalActor } from "@/server/portal/auth/with-portal-actor";
import { detachPortalFeedbackFile } from "@/server/portal/command-handler/detach-portal-feedback-file.command-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    customerId: string;
    roundId: string;
    itemId: string;
    fileId: string;
  }>;
};

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { customerId, roundId, itemId, fileId } = await params;
  return privatePortalFeedbackResponse(() =>
    withPortalActor(customerId.toLowerCase(), async (_request, actor) =>
      portalFeedbackWriteResponse(
        actor,
        await detachPortalFeedbackFile(actor, {
          roundId: roundId.toLowerCase(),
          itemId,
          fileId,
        }),
      ),
    )(request),
  );
}
