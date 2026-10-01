import "server-only";

import type { NextRequest } from "next/server";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import type { CrmOperation } from "@/common/constants/crm/crm-operations";
import { readJsonBody } from "@/lib/http/read-json-body";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";
import { questionnaireApiError } from "@/lib/workspace/crm/questionnaire-api-error";

/** Success answers carry the DTO without an envelope; a 409 carries the `VersionConflictDto`. */
export function questionnaireApiResponse<T>(
  result: QuestionnaireCommandResult<T>,
  successStatus: HttpResponseCode = HttpResponseCode.Ok,
): Response {
  if (result.ok) return Response.json(result.value, { status: successStatus });
  if ("conflict" in result)
    return Response.json(result.conflict, {
      status: HttpResponseCode.Conflict,
    });
  return questionnaireApiError(result.code, {
    details: "errors" in result ? result.errors : undefined,
  });
}

/** Unexpected failures are logged by operation only and answer a generic 500. */
export async function runQuestionnaireRoute(
  operation: CrmOperation,
  run: () => Promise<Response>,
): Promise<Response> {
  try {
    return await run();
  } catch (error: unknown) {
    logCrmFailure(operation, error);
    return questionnaireApiError(QuestionnaireErrorCode.Internal);
  }
}

/** A body that is not JSON at all is a 400; its shape is validated by the command. */
export async function withQuestionnaireBody(
  request: NextRequest,
  run: (body: unknown) => Promise<Response>,
): Promise<Response> {
  const parsed = await readJsonBody(request);
  return parsed.ok
    ? run(parsed.body)
    : questionnaireApiError(QuestionnaireErrorCode.ValidationError, {
        status: HttpResponseCode.BadRequest,
      });
}
