import type { CustomerFormDialogMode } from "@/common/constants/crm/forms/customer-form-dialog-modes";

/** What the URL asks the CRM overview to open; the page still verifies the customer exists. */
export type CustomerDialogRequest =
  | { mode: typeof CustomerFormDialogMode.Create }
  | { mode: typeof CustomerFormDialogMode.Edit; customerId: string };
