import "server-only";

import type { NextRequest } from "next/server";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiError } from "@/lib/workspace/crm/onboarding-api-error";
import { runQuestionnaireRoute } from "@/lib/workspace/crm/questionnaire-api-response";
import { getOnboardingFieldUsage } from "@/server/workspace/crm/query-handler/get-onboarding-field-usage.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string; fieldId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { formId, fieldId } = await params;
  return withCrmPermission(CrmEndpointAccessRule.OnboardingForm, (_, actor) =>
    runQuestionnaireRoute(CrmOperation.GetOnboardingFieldUsage, async () => {
      const found = await getOnboardingFieldUsage(formId, fieldId, actor);
      return found
        ? Response.json(found, { status: HttpResponseCode.Ok })
        : onboardingApiError(QuestionnaireErrorCode.FieldNotFound);
    }),
  )(request);
}
