import type { BaseContactFieldsValues } from "@/common/contracts/contact/fields/base-contact-fields-values";

export type QuickContactFormValues = BaseContactFieldsValues & {
  consentAccepted: boolean;
};
