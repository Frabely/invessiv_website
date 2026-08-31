import type { BaseContactFieldsValues } from "@invessiv/common/contracts/contact/fields/base-contact-fields-values";
import type { ContactProjectScope } from "@invessiv/common/constants/contact/contact-project-scopes";

export type ContactFormValues = BaseContactFieldsValues & {
  consentAccepted: boolean;
  projectScope: ContactProjectScope;
};
