import type { FeedbackHandoverValidationCode } from "@/common/constants/crm/forms/feedback-handover-validation-codes";
import type { FeedbackHandoverFormValues } from "./feedback-handover-form-values";

/** At most one code per field; an absent key means the field is fine. */
export type FeedbackHandoverFormErrors = Partial<
  Record<keyof FeedbackHandoverFormValues, FeedbackHandoverValidationCode>
>;
