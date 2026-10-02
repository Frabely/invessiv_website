import {
  ONBOARDING_ERROR_CODE_VALUES,
  OnboardingErrorCode as E,
} from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import { questionnaireApiError } from "@/lib/workspace/crm/questionnaire-api-error";

const STATUS: Record<E, H> = {
  [E.FormNotFound]: H.NotFound,
  [E.ProjectNotFound]: H.NotFound,
  [E.ProjectNotEligible]: H.Conflict,
  [E.FormExists]: H.Conflict,
  [E.InvalidTransition]: H.Conflict,
  [E.NotEditable]: H.Conflict,
  [E.RequiredMissing]: H.UnprocessableContent,
  [E.ReviewIncomplete]: H.Conflict,
  [E.CallDateRequired]: H.UnprocessableContent,
  [E.FileNotAttachable]: H.UnprocessableContent,
  [E.ReleaseWarnings]: H.Conflict,
  [E.ValidationError]: H.UnprocessableContent,
  [E.Internal]: H.InternalServerError,
};

const MESSAGES: Record<E, string> = {
  [E.FormNotFound]: "Form not found",
  [E.ProjectNotFound]: "Project not found",
  [E.ProjectNotEligible]:
    "An onboarding can only be started for a planned or active project",
  [E.FormExists]: "The project already has a form",
  [E.InvalidTransition]: "This status change is not possible",
  [E.NotEditable]: "The form can no longer be edited",
  [E.RequiredMissing]: "Required answers are missing",
  [E.ReviewIncomplete]: "The review is not finished yet",
  [E.CallDateRequired]: "The date of the onboarding call is missing",
  [E.FileNotAttachable]: "The file cannot be attached",
  [E.ReleaseWarnings]: "The release waits for acknowledged warnings",
  [E.ValidationError]: "Validation failed",
  [E.Internal]: "Unexpected server error",
};

function isOnboardingCode(code: E | QuestionnaireErrorCode): code is E {
  return (ONBOARDING_ERROR_CODE_VALUES as readonly string[]).includes(code);
}

/**
 * Form endpoints reuse the questionnaire kit, so its codes keep the status and text of the
 * catalog endpoints. `status` only overrides the mapping for a body that is not JSON at all.
 */
export function onboardingApiError(
  code: E | QuestionnaireErrorCode,
  options: { details?: unknown; status?: H } = {},
): Response {
  if (!isOnboardingCode(code)) return questionnaireApiError(code, options);
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(options.details !== undefined ? { details: options.details } : {}),
    },
    { status: options.status ?? STATUS[code] },
  );
}
