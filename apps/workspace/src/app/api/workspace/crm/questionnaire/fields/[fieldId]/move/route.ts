import "server-only";

import type { NextRequest } from "next/server";

import type { MoveQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/move-questionnaire-field-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import {
  questionnaireApiResponse,
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { moveQuestionnaireField } from "@/server/workspace/crm/command-handler/move-questionnaire-field.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ fieldId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { fieldId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.QuestionnaireCatalogWrite,
    (authorized) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.MoveQuestionnaireField, async () =>
          questionnaireApiResponse(
            // The command validates the body against its schema before using it.
            await moveQuestionnaireField(
              fieldId,
              body as MoveQuestionnaireFieldRequestDto,
            ),
          ),
        ),
      ),
  )(request);
}
