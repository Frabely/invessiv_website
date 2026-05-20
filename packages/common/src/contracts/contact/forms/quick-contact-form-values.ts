import type { BaseContactFieldsValues } from "@invessiv/common/contracts/contact/fields/base-contact-fields-values";

export type QuickContactFormValues = BaseContactFieldsValues & {
  consentAccepted: boolean;
};
