import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type LandingFinalCtaFieldCopy = {
  autocomplete?: string;
  hint?: string;
  label: string;
  placeholder?: string;
};

export type LandingFinalCtaFormCopy = {
  fields: {
    email: LandingFinalCtaFieldCopy;
    goal: LandingFinalCtaFieldCopy;
    honeypot: LandingFinalCtaFieldCopy;
    name: LandingFinalCtaFieldCopy;
    website: LandingFinalCtaFieldCopy;
  };
  consentLabel: string;
  privacyLabel: string;
  privacyHref: string;
  payloadContext: string;
  requiredHint: string;
  submitLabel: string;
  submittingLabel: string;
  successTitle: string;
  successBody: string;
  errorRequired: string;
  errorEmail: string;
  errorWebsite: string;
  errorConsent: string;
  errorRateLimited: string;
  errorDelivery: string;
  errorGeneric: string;
};

export type LandingFinalCtaContent = {
  body: string;
  eyebrow: string;
  form: LandingFinalCtaFormCopy;
  title: string;
  trustLine: string;
};

const LANDING_FINAL_CTA_CONTENT: Record<Locale, LandingFinalCtaContent> = {
  de: de as LandingFinalCtaContent,
  en: en as LandingFinalCtaContent,
};

export function getLandingFinalCtaContent(
  locale: Locale,
): LandingFinalCtaContent {
  return LANDING_FINAL_CTA_CONTENT[locale];
}
