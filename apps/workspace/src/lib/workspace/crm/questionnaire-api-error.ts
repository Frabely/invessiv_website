import { QuestionnaireErrorCode as E } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";

const STATUS: Record<E, H> = {
  [E.TemplateNotFound]: H.NotFound,
  [E.BlockNotFound]: H.NotFound,
  [E.FieldNotFound]: H.NotFound,
  [E.TranslationRequired]: H.UnprocessableContent,
  [E.InvalidCondition]: H.UnprocessableContent,
  [E.InvalidFieldConfig]: H.UnprocessableContent,
  [E.BlockInUse]: H.Conflict,
  [E.ChoiceInUse]: H.Conflict,
  [E.LastField]: H.Conflict,
  [E.LimitReached]: H.UnprocessableContent,
  [E.KeyTaken]: H.Conflict,
  [E.NotEditable]: H.Conflict,
  [E.ValidationError]: H.UnprocessableContent,
  [E.Internal]: H.InternalServerError,
};

const MESSAGES: Record<E, string> = {
  [E.TemplateNotFound]: "Template not found",
  [E.BlockNotFound]: "Block not found",
  [E.FieldNotFound]: "Field not found",
  [E.TranslationRequired]: "At least one language is required",
  [E.InvalidCondition]: "The condition is not valid for this field",
  [E.InvalidFieldConfig]: "The configuration does not fit the field type",
  [E.BlockInUse]: "The block is used by a template",
  [E.ChoiceInUse]: "An option that already has an answer cannot be removed",
  [E.LastField]: "The last field of a block or group in use cannot be removed",
  [E.LimitReached]: "A limit of the questionnaire kit is reached",
  [E.KeyTaken]: "The key is already taken",
  [E.NotEditable]: "The structure can no longer be changed",
  [E.ValidationError]: "Validation failed",
  [E.Internal]: "Unexpected server error",
};

/** `status` only overrides the mapping for a body that is not JSON at all (400 instead of 422). */
export function questionnaireApiError(
  code: E,
  options: { details?: unknown; status?: H } = {},
): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(options.details !== undefined ? { details: options.details } : {}),
    },
    { status: options.status ?? STATUS[code] },
  );
}
