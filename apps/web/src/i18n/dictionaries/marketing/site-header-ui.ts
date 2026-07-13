import type { SiteHeaderUiContent } from "@/common/contracts/marketing/site-header-ui-content";
import type { Locale } from "@/config/i18n";
import de from "./site-header-ui.de.json";
import en from "./site-header-ui.en.json";

const SITE_HEADER_UI_CONTENT: Record<Locale, SiteHeaderUiContent> = {
  de,
  en,
};

export function getSiteHeaderUiContent(locale: Locale): SiteHeaderUiContent {
  return SITE_HEADER_UI_CONTENT[locale];
}
