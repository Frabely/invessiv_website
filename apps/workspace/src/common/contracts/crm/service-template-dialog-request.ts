import type { ServiceTemplateFormDialogMode } from "@/common/constants/crm/forms/service-template-form-dialog-modes";

export type ServiceTemplateDialogRequest =
  | { mode: typeof ServiceTemplateFormDialogMode.Create }
  | {
      mode: typeof ServiceTemplateFormDialogMode.Edit;
      serviceTemplateId: string;
    };
