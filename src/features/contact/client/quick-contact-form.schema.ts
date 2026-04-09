export type QuickContactFormValues = {
  consentAccepted: boolean;
  email: string;
  fullName: string;
  message: string;
};

export const DEFAULT_QUICK_CONTACT_FORM_VALUES: QuickContactFormValues = {
  consentAccepted: false,
  email: "",
  fullName: "",
  message: "",
};
