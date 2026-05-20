export const CONTACT_FIELD_NAME = {
  DisplayName: "displayName",
  Email: "email",
} as const;

export type ContactFieldName =
  (typeof CONTACT_FIELD_NAME)[keyof typeof CONTACT_FIELD_NAME];
