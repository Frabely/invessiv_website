import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-field-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { createOnboardingFormField } from "@/server/workspace/crm/command-handler/create-onboarding-form-field.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string; blockId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { formId, blockId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(
          CrmOperation.CreateOnboardingFormField,
          async () =>
            onboardingApiResponse(
              // The command validates the body against its schema before using it.
              await createOnboardingFormField(
                formId,
                blockId,
                body as CreateQuestionnaireFieldRequestDto,
                actor,
              ),
              HttpResponseCode.Created,
            ),
        ),
      ),
  )(request);
}
