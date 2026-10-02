import "server-only";

import type { NextRequest } from "next/server";

import type { ReviewOnboardingBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/review-onboarding-block-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { reviewOnboardingBlock } from "@/server/workspace/crm/command-handler/review-onboarding-block.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string; blockId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { formId, blockId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.ReviewOnboardingBlock, async () =>
          onboardingApiResponse(
            // The command validates the body against its schema before using it.
            await reviewOnboardingBlock(
              formId,
              blockId,
              body as ReviewOnboardingBlockRequestDto,
              actor,
            ),
          ),
        ),
      ),
  )(request);
}
