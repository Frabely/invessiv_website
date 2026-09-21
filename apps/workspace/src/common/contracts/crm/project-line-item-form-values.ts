import type { ProjectLineItemFormValidationCode } from "@/common/constants/crm/forms/project-line-item-form-validation-codes";
import type {
  LineItemFieldsFormErrors,
  LineItemFieldsFormValues,
} from "@/common/contracts/crm/line-item-fields-form-values";

/**
 * The shared snapshot fields plus the origin template. The template is only a starting point:
 * it pre-fills the other fields and is stored as provenance, never as a live reference.
 */
export type ProjectLineItemFormValues = LineItemFieldsFormValues & {
  sourceLineItemTemplateId: string | null;
};

export type ProjectLineItemFormErrors = LineItemFieldsFormErrors & {
  sourceLineItemTemplateId?: ProjectLineItemFormValidationCode;
};
