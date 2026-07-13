import type { SiteHeaderContent } from "@/common/contracts/marketing/site-header-content";
import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

const LANDING_HEADER_CONTENT: Record<Locale, SiteHeaderContent> = {
  de,
  en,
};

export function getLandingHeaderContent(locale: Locale): SiteHeaderContent {
  return LANDING_HEADER_CONTENT[locale];
}
