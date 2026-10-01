import "server-only";

import type { NextRequest } from "next/server";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiError } from "@/lib/workspace/crm/onboarding-api-error";
import { runQuestionnaireRoute } from "@/lib/workspace/crm/questionnaire-api-response";
import { getOnboardingForm } from "@/server/workspace/crm/query-handler/get-onboarding-form.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { formId } = await params;
  return withCrmPermission(CrmEndpointAccessRule.OnboardingForm, (_, actor) =>
    runQuestionnaireRoute(CrmOperation.GetOnboardingForm, async () => {
      const found = await getOnboardingForm(formId, actor);
      return found
        ? Response.json(found, { status: HttpResponseCode.Ok })
        : onboardingApiError(OnboardingErrorCode.FormNotFound);
    }),
  )(request);
}
