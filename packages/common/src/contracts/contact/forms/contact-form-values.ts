import type { BaseContactFieldsValues } from "@invessiv/common/contracts/contact/fields/base-contact-fields-values";
import type { ContactProjectScope } from "@invessiv/common/constants/contact/contact-project-scopes";

export type ContactFormValues = BaseContactFieldsValues & {
  consentAccepted: boolean;
  /** Stays empty for humans; a filled value marks the submit as a bot. */
  honeypot: string;
  projectScope?: ContactProjectScope;
};
