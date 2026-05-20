export const CONTACT_FORM_FIELD_NAME = {
  Goal: "goal",
  Website: "website",
} as const;

export type ContactFormFieldName =
  (typeof CONTACT_FORM_FIELD_NAME)[keyof typeof CONTACT_FORM_FIELD_NAME];
