import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalOnboardingQueryParam } from "@/common/constants/portal/portal-onboarding-query-params";
import { isSupportedLocale } from "@/config/i18n";
import {
  portalOnboardingNotFound,
  privatePortalOnboardingResponse,
} from "@/lib/portal/portal-onboarding-api-error";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";
import { withPortalReader } from "@/server/portal/auth/with-portal-reader";
import { getPortalOnboardingForm } from "@/server/portal/query-handler/get-portal-onboarding-form.query-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ customerId: string; formId: string }>;
};

/** Block and field texts are resolved in the locale of the query, like the page does for its route. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { customerId, formId } = await params;
  const requested = request.nextUrl.searchParams.get(
    PortalOnboardingQueryParam.Locale,
  );
  const locale =
    requested && isSupportedLocale(requested) ? requested : DEFAULT_LOCALE;
  return privatePortalOnboardingResponse(() =>
    withPortalReader(customerId.toLowerCase(), async (_request, reader) => {
      const form = await getPortalOnboardingForm(
        reader,
        formId.toLowerCase(),
        locale,
      );
      return form
        ? Response.json(form, { status: HttpResponseCode.Ok })
        : portalOnboardingNotFound();
    })(request),
  );
}
