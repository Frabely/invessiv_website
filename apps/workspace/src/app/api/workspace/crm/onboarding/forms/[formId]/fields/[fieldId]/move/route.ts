import "server-only";

import type { NextRequest } from "next/server";

import type { MoveQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/move-questionnaire-field-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { moveOnboardingFormField } from "@/server/workspace/crm/command-handler/move-onboarding-form-field.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string; fieldId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { formId, fieldId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.MoveOnboardingFormField, async () =>
          onboardingApiResponse(
            // The command validates the body against its schema before using it.
            await moveOnboardingFormField(
              formId,
              fieldId,
              body as MoveQuestionnaireFieldRequestDto,
              actor,
            ),
          ),
        ),
      ),
  )(request);
}
