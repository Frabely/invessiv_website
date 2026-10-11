import type { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import type { DurationInputError } from "@/common/constants/crm/forms/duration-input-errors";
import type { ProjectLineItemFormValidationCode } from "@/common/constants/crm/forms/project-line-item-form-validation-codes";
import type {
  LineItemFieldsFormErrors,
  LineItemFieldsFormValues,
} from "@/common/contracts/crm/line-item-fields-form-values";

/**
 * The shared snapshot fields plus the origin template. The template is only a starting point:
 * it pre-fills the other fields and is stored as provenance, never as a live reference. Its kind
 * travels along because it decides whether the form asks for a quantity and keeps the status.
 */
export type ProjectLineItemFormValues = LineItemFieldsFormValues & {
  sourceLineItemTemplateId: string | null;
  status?: ProjectLineItemStatus;
  kind: LineItemKind;
  /** Purchased time as typed (`h:mm`); read to minutes on submit and only for kind `hours`. */
  quantityInput: string;
  /** Hours only: allocate them to this project (default) or leave them free for the customer. */
  allocateHoursToProject: boolean;
};

export type ProjectLineItemFormErrors = LineItemFieldsFormErrors & {
  sourceLineItemTemplateId?: ProjectLineItemFormValidationCode;
  quantityInput?: DurationInputError;
};
