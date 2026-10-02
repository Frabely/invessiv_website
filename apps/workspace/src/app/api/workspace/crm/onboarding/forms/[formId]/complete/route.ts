import "server-only";

import type { NextRequest } from "next/server";

import type { CompleteOnboardingFormRequestDto } from "@invessiv/common/contracts/crm/onboarding/complete-onboarding-form-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { completeOnboardingForm } from "@/server/workspace/crm/command-handler/complete-onboarding-form.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { formId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.CompleteOnboardingForm, async () =>
          onboardingApiResponse(
            // The command validates the body against its schema before using it.
            await completeOnboardingForm(
              formId,
              body as CompleteOnboardingFormRequestDto,
              actor,
            ),
          ),
        ),
      ),
  )(request);
}
