import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { ApplyOnboardingFormTemplateRequestDto } from "@invessiv/common/contracts/crm/onboarding/apply-onboarding-form-template-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { applyOnboardingFormTemplate } from "@/server/workspace/crm/command-handler/apply-onboarding-form-template.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { formId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormTemplateApply,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(
          CrmOperation.ApplyOnboardingFormTemplate,
          async () =>
            onboardingApiResponse(
              await applyOnboardingFormTemplate(
                formId,
                body as ApplyOnboardingFormTemplateRequestDto,
                actor,
              ),
              HttpResponseCode.Ok,
            ),
        ),
      ),
  )(request);
}
