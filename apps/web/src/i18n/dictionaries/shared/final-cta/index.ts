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
    website?: FinalCtaFieldCopy;
  };
  consentLabel: string;
  privacyLabel: string;
  privacyHref: string;
  payloadContext: string;
  requiredHint: string;
  submitLabel: string;
  submittingLabel: string;
  errorRequired: string;
  errorEmail: string;
  errorWebsite?: string;
  errorConsent: string;
  errorRateLimited: string;
  errorDelivery: string;
  errorGeneric: string;
};

export type FinalCtaContent = {
  body: string;
  eyebrow: string;
  form: FinalCtaFormCopy;
  title: string;
  trustLine: string;
};
