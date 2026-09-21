import type { LineItemTemplateFormDialogMode } from "@/common/constants/crm/forms/line-item-template-form-dialog-modes";

export type LineItemTemplateDialogRequest =
  | { mode: typeof LineItemTemplateFormDialogMode.Create }
  | {
      mode: typeof LineItemTemplateFormDialogMode.Edit;
      lineItemTemplateId: string;
    };
