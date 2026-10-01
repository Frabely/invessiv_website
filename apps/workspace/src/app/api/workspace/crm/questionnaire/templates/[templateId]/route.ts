import "server-only";

import type { NextRequest } from "next/server";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateQuestionnaireTemplateRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-template-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { questionnaireApiError } from "@/lib/workspace/crm/questionnaire-api-error";
import {
  questionnaireApiResponse,
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { updateQuestionnaireTemplate } from "@/server/workspace/crm/command-handler/update-questionnaire-template.command-handler";
import { getQuestionnaireTemplate } from "@/server/workspace/crm/query-handler/get-questionnaire-template.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ templateId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { templateId } = await params;
  return withCrmPermission(CrmEndpointAccessRule.QuestionnaireCatalog, () =>
    runQuestionnaireRoute(CrmOperation.GetQuestionnaireTemplate, async () => {
      const template = await getQuestionnaireTemplate(templateId);
      return template
        ? Response.json(template, { status: HttpResponseCode.Ok })
        : questionnaireApiError(QuestionnaireErrorCode.TemplateNotFound);
    }),
  )(request);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { templateId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.QuestionnaireCatalogWrite,
    (authorized) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(
          CrmOperation.UpdateQuestionnaireTemplate,
          async () =>
            questionnaireApiResponse(
              // The command validates the body against its schema before using it.
              await updateQuestionnaireTemplate(
                templateId,
                body as UpdateQuestionnaireTemplateRequestDto,
              ),
            ),
        ),
      ),
  )(request);
}
