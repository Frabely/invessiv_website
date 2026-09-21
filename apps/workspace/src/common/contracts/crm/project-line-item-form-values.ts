import type { ProjectLineItemFormValidationCode } from "@/common/constants/crm/forms/project-line-item-form-validation-codes";
import type {
  LineItemFieldsFormErrors,
  LineItemFieldsFormValues,
} from "@/common/contracts/crm/line-item-fields-form-values";
import type { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";

/**
 * The shared snapshot fields plus the origin template. The template is only a starting point:
 * it pre-fills the other fields and is stored as provenance, never as a live reference.
 */
export type ProjectLineItemFormValues = LineItemFieldsFormValues & {
  sourceLineItemTemplateId: string | null;
  status?: ProjectLineItemStatus;
};

export type ProjectLineItemFormErrors = LineItemFieldsFormErrors & {
  sourceLineItemTemplateId?: ProjectLineItemFormValidationCode;
};
