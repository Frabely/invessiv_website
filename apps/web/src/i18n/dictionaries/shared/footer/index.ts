import type { Locale } from "@/config/i18n";
import de from "./de.json";
import en from "./en.json";

export type FooterStaticContent = {
  brand: string;
  copyright: string;
  legalTitle: string;
  legalLinks: Array<{ label: string; href: string }>;
  invessivTitle: string;
  referencesLabel: string;
  invessivLinks: Array<{ label: string; href: string }>;
  contactTitle: string;
};

const FOOTER_STATIC_CONTENT: Record<Locale, FooterStaticContent> = { de, en };

export function getFooterStaticContent(locale: Locale): FooterStaticContent {
  return FOOTER_STATIC_CONTENT[locale];
}
