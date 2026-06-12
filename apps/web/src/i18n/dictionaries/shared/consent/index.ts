import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type ConsentCategoryCopy = {
  title: string;
  description: string;
};

export type ConsentStaticContent = {
  banner: {
    title: string;
    description: string;
    privacyLabel: string;
    acceptAll: string;
    reject: string;
    settings: string;
    save: string;
  };
  categories: {
    necessary: ConsentCategoryCopy;
    analytics: ConsentCategoryCopy;
    marketing: ConsentCategoryCopy;
  };
  necessaryStateLabel: string;
  cookieSettingsLabel: string;
};

const CONSENT_STATIC_CONTENT: Record<Locale, ConsentStaticContent> = { de, en };

export function getConsentStaticContent(locale: Locale): ConsentStaticContent {
  return CONSENT_STATIC_CONTENT[locale];
}
