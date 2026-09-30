import type { HandOverFeedbackRoundRequestDto } from "@invessiv/common/contracts/crm/hand-over-feedback-round-request.dto";
import { validateFileLink } from "@invessiv/common/patterns/files/validate-file-link";
import { FeedbackHandoverValidationCode } from "@/common/constants/crm/forms/feedback-handover-validation-codes";
import type { FeedbackHandoverFormErrors } from "@/common/contracts/crm/feedback-handover-form-errors";
import type { FeedbackHandoverFormValues } from "@/common/contracts/crm/feedback-handover-form-values";

export function createFeedbackHandoverValues(input: {
  previewUrl: string | null;
  areaOptions: readonly string[];
}): FeedbackHandoverFormValues {
  return {
    previewUrl: input.previewUrl ?? "",
    handoverNote: "",
    dueOn: "",
    areaOptions: [...input.areaOptions],
  };
}

/**
 * Mirrors the server rules that a person can fix in the dialog; the server stays the authority.
 * The preview must pass the same HTTPS check as a shared file link.
 */
export function validateFeedbackHandover(
  values: FeedbackHandoverFormValues,
  today: string,
): FeedbackHandoverFormErrors {
  const errors: FeedbackHandoverFormErrors = {};
  const previewUrl = values.previewUrl.trim();
  if (previewUrl && !validateFileLink(previewUrl))
    errors.previewUrl = FeedbackHandoverValidationCode.PreviewUrlInvalid;
  if (values.dueOn && values.dueOn < today)
    errors.dueOn = FeedbackHandoverValidationCode.DueOnPast;
  return errors;
}

export function toHandOverRequest(
  values: FeedbackHandoverFormValues,
): HandOverFeedbackRoundRequestDto {
  return {
    previewUrl: values.previewUrl.trim() || null,
    handoverNote: values.handoverNote.trim() || null,
    dueOn: values.dueOn || null,
    areaOptions: values.areaOptions,
  };
}
