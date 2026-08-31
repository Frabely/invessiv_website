import type { ContactFormValues } from "@invessiv/common/contracts/contact/forms/contact-form-values";
import { DEFAULT_BASE_CONTACT_FIELDS_VALUES } from "@invessiv/common/defaults/contact/base-contact-fields-values";
import { CONTACT_PROJECT_SCOPE } from "@invessiv/common/constants/contact/contact-project-scopes";

export const DEFAULT_CONTACT_FORM_VALUES: ContactFormValues = {
  ...DEFAULT_BASE_CONTACT_FIELDS_VALUES,
  consentAccepted: false,
  projectScope: CONTACT_PROJECT_SCOPE.Unsure,
};
