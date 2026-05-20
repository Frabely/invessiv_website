import type { Locale } from "@/config/i18n";
import outreachDe from "./de.json";
import outreachEn from "./en.json";

export type LeadsOutreachDictionary = typeof outreachDe;

const LEADS_OUTREACH: Record<Locale, LeadsOutreachDictionary> = {
  de: outreachDe,
  en: outreachEn,
};

export function getLeadsOutreachDictionary(
  locale: Locale,
): LeadsOutreachDictionary {
  return LEADS_OUTREACH[locale];
}
