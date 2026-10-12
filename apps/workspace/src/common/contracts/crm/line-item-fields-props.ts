import type { LineItemFieldsContent } from "@/common/contracts/crm/line-item-fields-content";
import type {
  LineItemFieldsFormErrors,
  LineItemFieldsFormValues,
} from "@/common/contracts/crm/line-item-fields-form-values";

/** What the identity and the pricing fields of a line item form both take. */
export type LineItemFieldsProps = {
  content: LineItemFieldsContent;
  errors: LineItemFieldsFormErrors;
  namePrefix: string;
  onChangeAction: (patch: Partial<LineItemFieldsFormValues>) => void;
  values: LineItemFieldsFormValues;
};
