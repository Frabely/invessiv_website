import "server-only";

import type { NextRequest } from "next/server";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { DeleteQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-block-request.dto";
import type { UpdateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-block-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { questionnaireApiError } from "@/lib/workspace/crm/questionnaire-api-error";
import {
  questionnaireApiResponse,
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { deleteQuestionnaireBlock } from "@/server/workspace/crm/command-handler/delete-questionnaire-block.command-handler";
import { updateQuestionnaireBlock } from "@/server/workspace/crm/command-handler/update-questionnaire-block.command-handler";
import { getQuestionnaireBlock } from "@/server/workspace/crm/query-handler/get-questionnaire-block.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ blockId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { blockId } = await params;
  return withCrmPermission(CrmEndpointAccessRule.QuestionnaireCatalog, () =>
    runQuestionnaireRoute(CrmOperation.GetQuestionnaireBlock, async () => {
      const block = await getQuestionnaireBlock(blockId);
      return block
        ? Response.json(block, { status: HttpResponseCode.Ok })
        : questionnaireApiError(QuestionnaireErrorCode.BlockNotFound);
    }),
  )(request);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { blockId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.QuestionnaireCatalogWrite,
    (authorized) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.UpdateQuestionnaireBlock, async () =>
          questionnaireApiResponse(
            // The command validates the body against its schema before using it.
            await updateQuestionnaireBlock(
              blockId,
              body as UpdateQuestionnaireBlockRequestDto,
            ),
          ),
        ),
      ),
  )(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { blockId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.QuestionnaireCatalogWrite,
    (authorized) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(CrmOperation.DeleteQuestionnaireBlock, async () =>
          questionnaireApiResponse(
            // The command validates the body; success answers with the block as it was.
            await deleteQuestionnaireBlock(
              blockId,
              body as DeleteQuestionnaireBlockRequestDto,
            ),
          ),
        ),
      ),
  )(request);
}
