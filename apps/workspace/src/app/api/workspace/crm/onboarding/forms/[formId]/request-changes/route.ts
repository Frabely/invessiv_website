import "server-only";

import type { NextRequest } from "next/server";

import type { RequestOnboardingChangesRequestDto } from "@invessiv/common/contracts/crm/onboarding/request-onboarding-changes-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { requestOnboardingChanges } from "@/server/workspace/crm/command-handler/request-onboarding-changes.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ formId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { formId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.RequestOnboardingChanges, async () =>
          onboardingApiResponse(
            // The command validates the body against its schema before using it.
            await requestOnboardingChanges(
              formId,
              body as RequestOnboardingChangesRequestDto,
              actor,
            ),
          ),
        ),
      ),
  )(request);
}
