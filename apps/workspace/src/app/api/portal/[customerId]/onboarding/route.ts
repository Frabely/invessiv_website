import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { privatePortalOnboardingResponse } from "@/lib/portal/portal-onboarding-api-error";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { listPortalOnboardingForms } from "@/server/portal/query-handler/list-portal-onboarding-forms.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ customerId: string }> };

/** Contacts and the owner view read; only a contact may write through the form routes. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId } = await params;
  return privatePortalOnboardingResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (_request, reader) =>
      Response.json(await listPortalOnboardingForms(reader), {
        status: HttpResponseCode.Ok,
      }),
    )(request),
  );
}
