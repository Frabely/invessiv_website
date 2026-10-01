import "server-only";

import type { NextRequest } from "next/server";

import type { RemoveOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/remove-onboarding-form-block-request.dto";
import type { UpdateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-block-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { removeOnboardingFormBlock } from "@/server/workspace/crm/command-handler/remove-onboarding-form-block.command-handler";
import { updateOnboardingFormBlock } from "@/server/workspace/crm/command-handler/update-onboarding-form-block.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string; blockId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { formId, blockId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(
          CrmOperation.UpdateOnboardingFormBlock,
          async () =>
            onboardingApiResponse(
              // The command validates the body against its schema before using it.
              await updateOnboardingFormBlock(
                formId,
                blockId,
                body as UpdateQuestionnaireBlockRequestDto,
                actor,
              ),
            ),
        ),
      ),
  )(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { formId, blockId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(
          CrmOperation.RemoveOnboardingFormBlock,
          async () =>
            onboardingApiResponse(
              // The command validates the body against its schema before using it.
              await removeOnboardingFormBlock(
                formId,
                blockId,
                body as RemoveOnboardingFormBlockRequestDto,
                actor,
              ),
            ),
        ),
      ),
  )(request);
}
