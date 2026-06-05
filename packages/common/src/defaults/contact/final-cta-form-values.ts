import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";
import type { FinalCtaFormValues } from "@invessiv/common/contracts/contact/forms/final-cta-form-values";

export const DEFAULT_FINAL_CTA_FORM_VALUES: FinalCtaFormValues = {
  email: "",
  honeypot: "",
  name: "",
  [CONTACT_FORM_FIELD_NAME.ConsentAccepted]: false,
  [CONTACT_FORM_FIELD_NAME.Goal]: "",
  [CONTACT_FORM_FIELD_NAME.Website]: "",
};
