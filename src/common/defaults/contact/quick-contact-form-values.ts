import type { QuickContactFormValues } from "@/common/contracts/contact/forms/quick-contact-form-values";
import { DEFAULT_BASE_CONTACT_FIELDS_VALUES } from "@/common/defaults/contact/base-contact-fields-values";

export const DEFAULT_QUICK_CONTACT_FORM_VALUES: QuickContactFormValues = {
  ...DEFAULT_BASE_CONTACT_FIELDS_VALUES,
  consentAccepted: false,
};
