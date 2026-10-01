import "server-only";

import type { NextRequest } from "next/server";

import type { MoveOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/move-onboarding-form-block-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { moveOnboardingFormBlock } from "@/server/workspace/crm/command-handler/move-onboarding-form-block.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string; blockId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { formId, blockId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.MoveOnboardingFormBlock, async () =>
          onboardingApiResponse(
            // The command validates the body against its schema before using it.
            await moveOnboardingFormBlock(
              formId,
              blockId,
              body as MoveOnboardingFormBlockRequestDto,
              actor,
            ),
          ),
        ),
      ),
  )(request);
}
