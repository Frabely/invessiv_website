import { CONTACT_FORM_FIELD_NAME } from "@invessiv/common/constants/contact/contact-form-field-names";

export type FinalCtaFormValues = {
  email: string;
  honeypot: string;
  name: string;
  [CONTACT_FORM_FIELD_NAME.ConsentAccepted]: boolean;
  [CONTACT_FORM_FIELD_NAME.Goal]: string;
  [CONTACT_FORM_FIELD_NAME.Website]: string;
};
