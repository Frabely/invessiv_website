import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-field-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import {
  questionnaireApiResponse,
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { createQuestionnaireField } from "@/server/workspace/crm/command-handler/create-questionnaire-field.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ blockId: string }> };

/** Answers with the whole block, so the editor re-renders order and conditions from one source. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { blockId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.QuestionnaireCatalogWrite,
    (authorized) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.CreateQuestionnaireField, async () =>
          questionnaireApiResponse(
            // The command validates the body against its schema before using it.
            await createQuestionnaireField(
              blockId,
              body as CreateQuestionnaireFieldRequestDto,
            ),
            HttpResponseCode.Created,
          ),
        ),
      ),
  )(request);
}
