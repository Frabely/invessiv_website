import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { DuplicateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/duplicate-questionnaire-block-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import {
  questionnaireApiResponse,
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { duplicateQuestionnaireBlock } from "@/server/workspace/crm/command-handler/duplicate-questionnaire-block.command-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ blockId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { blockId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.QuestionnaireCatalogWrite,
    (authorized) =>
      withQuestionnaireBody(authorized, (body) =>
        runQuestionnaireRoute(
          CrmOperation.DuplicateQuestionnaireBlock,
          async () =>
            questionnaireApiResponse(
              // The command validates the body against its schema before using it.
              await duplicateQuestionnaireBlock(
                blockId,
                body as DuplicateQuestionnaireBlockRequestDto,
              ),
              HttpResponseCode.Created,
            ),
        ),
      ),
  )(request);
}
