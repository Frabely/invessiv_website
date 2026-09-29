import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import {
  portalFeedbackNotFound,
  privatePortalFeedbackResponse,
} from "@/lib/portal/portal-feedback-api-error";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { getPortalProjectFeedback } from "@/server/portal/query-handler/get-portal-project-feedback.query-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; projectId: string }>;
};

/** Contacts and the owner view read; only a contact may write through the round routes. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId, projectId } = await params;
  return privatePortalFeedbackResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (_request, reader) => {
      const feedback = await getPortalProjectFeedback(
        reader,
        projectId.toLowerCase(),
      );
      return feedback
        ? Response.json(feedback, { status: HttpResponseCode.Ok })
        : portalFeedbackNotFound();
    })(request),
  );
}
