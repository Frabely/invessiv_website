import "server-only";

import type { NextRequest } from "next/server";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { StartProjectOnboardingRequestDto } from "@invessiv/common/contracts/crm/onboarding/start-project-onboarding-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { onboardingApiError } from "@/lib/workspace/crm/onboarding-api-error";
import { onboardingApiResponse } from "@/lib/workspace/crm/onboarding-api-response";
import {
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { getProjectOnboarding } from "@/server/workspace/crm/query-handler/get-project-onboarding.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;
  return withCrmPermission(CrmEndpointAccessRule.OnboardingForm, (_, actor) =>
    runQuestionnaireRoute(CrmOperation.GetProjectOnboarding, async () => {
      const found = await getProjectOnboarding(projectId, actor);
      return found
        ? Response.json(found, { status: HttpResponseCode.Ok })
        : onboardingApiError(OnboardingErrorCode.ProjectNotFound);
    }),
  )(request);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.OnboardingFormWrite,
    (authorized, actor) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.StartProjectOnboarding, async () =>
          onboardingApiResponse(
            // The command validates the body against its schema before using it.
            await startProjectOnboarding(
              projectId,
              body as StartProjectOnboardingRequestDto,
              actor,
            ),
            HttpResponseCode.Created,
          ),
        ),
      ),
  )(request);
}
