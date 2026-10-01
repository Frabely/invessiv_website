import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { AddOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/add-onboarding-form-block-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { addOnboardingFormBlock } from "@/server/workspace/crm/command-handler/add-onboarding-form-block.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { formId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.AddOnboardingFormBlock, async () =>
          onboardingApiResponse(
            // The command validates the body against its schema before using it.
            await addOnboardingFormBlock(
              formId,
              body as AddOnboardingFormBlockRequestDto,
              actor,
            ),
            HttpResponseCode.Created,
          ),
        ),
      ),
  )(request);
}
