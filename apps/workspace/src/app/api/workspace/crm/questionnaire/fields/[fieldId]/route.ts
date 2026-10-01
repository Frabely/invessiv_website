import "server-only";

import type { NextRequest } from "next/server";

import type { DeleteQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-field-request.dto";
import type { UpdateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-field-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import {
  questionnaireApiResponse,
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { deleteQuestionnaireField } from "@/server/workspace/crm/command-handler/delete-questionnaire-field.command-handler";
import { updateQuestionnaireField } from "@/server/workspace/crm/command-handler/update-questionnaire-field.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ fieldId: string }> };

/** Only fields of catalog blocks; a field of a form's block answers 404 here. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { fieldId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.QuestionnaireCatalogWrite,
    (authorized) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.UpdateQuestionnaireField, async () =>
          questionnaireApiResponse(
            // The command validates the body against its schema before using it.
            await updateQuestionnaireField(
              fieldId,
              body as UpdateQuestionnaireFieldRequestDto,
            ),
          ),
        ),
      ),
  )(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { fieldId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.QuestionnaireCatalogWrite,
    (authorized) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.DeleteQuestionnaireField, async () =>
          questionnaireApiResponse(
            await deleteQuestionnaireField(
              fieldId,
              body as DeleteQuestionnaireFieldRequestDto,
            ),
          ),
        ),
      ),
  )(request);
}
