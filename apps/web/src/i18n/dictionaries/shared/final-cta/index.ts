export type FinalCtaFieldCopy = {
  autocomplete?: string;
  hint?: string;
  label: string;
  placeholder?: string;
};

export type FinalCtaFormCopy = {
  fields: {
    email: FinalCtaFieldCopy;
    goal: FinalCtaFieldCopy;
    honeypot: FinalCtaFieldCopy;
    name: FinalCtaFieldCopy;
  };
  consentLabel: string;
  privacyLabel: string;
  privacySuffix: string;
  privacyHref: string;
  requiredHint: string;
  submitLabel: string;
  submittingLabel: string;
  errorRequired: string;
  errorEmail: string;
  errorConsent: string;
  errorRateLimited: string;
  errorDelivery: string;
  errorGeneric: string;
  callSubmitSuccess: string;
  emailQuestion: string;
  emailNote: string;
  emailSubmitLabel: string;
  emailSubmittingLabel: string;
  emailSubmitSuccess: string;
};

export type FinalCtaContent = {
  body: string;
  eyebrow: string;
  form: FinalCtaFormCopy;
  portrait: {
    imageAlt: string;
  };
  title: string;
  trustLine: string;
};
