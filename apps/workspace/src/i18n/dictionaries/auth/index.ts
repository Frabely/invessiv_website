import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type AuthContent = (typeof de)["auth"];

const AUTH_CONTENT: Record<Locale, AuthContent> = {
  de: de.auth,
  en: en.auth,
};

export function getAuthContent(locale: Locale): AuthContent {
  return AUTH_CONTENT[locale];
}
