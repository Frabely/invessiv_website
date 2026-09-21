import type { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type {
  LineItemFieldsFormErrors,
  LineItemFieldsFormValues,
} from "@/common/contracts/crm/line-item-fields-form-values";

/** The shared snapshot fields plus the archive state, which only the catalog has. */
export type LineItemTemplateFormValues = LineItemFieldsFormValues & {
  status: LineItemTemplateStatus;
};

export type LineItemTemplateFormErrors = LineItemFieldsFormErrors;
