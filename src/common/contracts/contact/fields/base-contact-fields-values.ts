import type { ContactIdentityFieldsValues } from "@/common/contracts/contact/fields/contact-identity-fields-values";

export type BaseContactFieldsValues = ContactIdentityFieldsValues & {
  message: string;
};
