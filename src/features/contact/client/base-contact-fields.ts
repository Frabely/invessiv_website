export type ContactIdentityFieldsValues = {
  email: string;
  fullName: string;
};

export type BaseContactFieldsValues = ContactIdentityFieldsValues & {
  message: string;
};

export const DEFAULT_CONTACT_IDENTITY_FIELDS_VALUES: ContactIdentityFieldsValues =
  {
    email: "",
    fullName: "",
  };

export const DEFAULT_BASE_CONTACT_FIELDS_VALUES: BaseContactFieldsValues = {
  ...DEFAULT_CONTACT_IDENTITY_FIELDS_VALUES,
  message: "",
};

export const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactIdentityFieldsCopy = {
  emailLabel: string;
  fullNameLabel: string;
};

export type ContactMessageFieldCopy = {
  messageLabel: string;
  messagePlaceholder: string;
};
