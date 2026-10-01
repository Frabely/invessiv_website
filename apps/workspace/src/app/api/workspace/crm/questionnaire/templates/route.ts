import "server-only";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateQuestionnaireTemplateRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-template-request.dto";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { parseQuestionnaireCatalogFilters } from "@/common/patterns/crm/questionnaire/questionnaire-catalog-search-params";
import { withCrmPermission } from "@/lib/auth/api";
import {
  questionnaireApiResponse,
  runQuestionnaireRoute,
  withQuestionnaireBody,
} from "@/lib/workspace/crm/questionnaire-api-response";
import { createQuestionnaireTemplate } from "@/server/workspace/crm/command-handler/create-questionnaire-template.command-handler";
import { listQuestionnaireTemplates } from "@/server/workspace/crm/query-handler/list-questionnaire-templates.query-handler";

export const runtime = "nodejs";

export const GET = withCrmPermission(
  CrmEndpointAccessRule.QuestionnaireCatalog,
  (request) =>
    runQuestionnaireRoute(CrmOperation.ListQuestionnaireTemplates, async () => {
      const { status, search } = parseQuestionnaireCatalogFilters(
        Object.fromEntries(new URL(request.url).searchParams.entries()),
      );
      return Response.json(
        await listQuestionnaireTemplates({ status, search }),
        {
          status: HttpResponseCode.Ok,
        },
      );
    }),
);

export const POST = withCrmPermission(
  CrmEndpointAccessRule.QuestionnaireCatalogWrite,
  (request) =>
    withQuestionnaireBody(request, (body) =>
      runQuestionnaireRoute(
        CrmOperation.CreateQuestionnaireTemplate,
        async () =>
          questionnaireApiResponse(
            // The command validates the body against its schema before using it.
            await createQuestionnaireTemplate(
              body as CreateQuestionnaireTemplateRequestDto,
            ),
            HttpResponseCode.Created,
          ),
      ),
    ),
);
