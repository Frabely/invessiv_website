import type { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import type { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import type { LineItemTemplateFormValidationCode } from "@/common/constants/crm/forms/line-item-template-form-validation-codes";
import type {
  LineItemFieldsFormErrors,
  LineItemFieldsFormValues,
} from "@/common/contracts/crm/line-item-fields-form-values";

/**
 * The shared snapshot fields plus what only the catalog has: the archive state, what an assignment
 * does (kind), which project it belongs to and whether customers may request it in the portal.
 */
export type LineItemTemplateFormValues = LineItemFieldsFormValues & {
  status: LineItemTemplateStatus;
  kind: LineItemKind;
  projectMode: LineItemProjectMode;
  portalRequestable: boolean;
  portalDescription: string;
};

export type LineItemTemplateFormErrors = LineItemFieldsFormErrors & {
  portalDescription?: LineItemTemplateFormValidationCode;
};
