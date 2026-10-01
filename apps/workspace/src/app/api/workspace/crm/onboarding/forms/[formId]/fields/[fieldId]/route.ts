import "server-only";

import type { NextRequest } from "next/server";

import type { DeleteQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-field-request.dto";
import type { UpdateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-field-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { deleteOnboardingFormField } from "@/server/workspace/crm/command-handler/delete-onboarding-form-field.command-handler";
import { updateOnboardingFormField } from "@/server/workspace/crm/command-handler/update-onboarding-form-field.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string; fieldId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { formId, fieldId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(
          CrmOperation.UpdateOnboardingFormField,
          async () =>
            onboardingApiResponse(
              // The command validates the body against its schema before using it.
              await updateOnboardingFormField(
                formId,
                fieldId,
                body as UpdateQuestionnaireFieldRequestDto,
                actor,
              ),
            ),
        ),
      ),
  )(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { formId, fieldId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(
          CrmOperation.DeleteOnboardingFormField,
          async () =>
            onboardingApiResponse(
              // The command validates the body against its schema before using it.
              await deleteOnboardingFormField(
                formId,
                fieldId,
                body as DeleteQuestionnaireFieldRequestDto,
                actor,
              ),
            ),
        ),
      ),
  )(request);
}
