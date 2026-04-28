import { SocialPlatform } from "@/common/constants/social/social-platforms";
import type { Locale } from "@/config/i18n";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import de from "./de.json";
import en from "./en.json";

export type LandingFooterContent = {
  bottomNote?: string;
  brand: string;
  columns: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }>;
  copyright: string;
  description: string;
  legalLinks: Array<{
    label: string;
    href: string;
  }>;
  socialLinks: Array<{
    platform: SocialPlatform;
    href: string;
    label: string;
  }>;
};

const LANDING_FOOTER_CONTENT: Record<Locale, LandingFooterContent> = {
  de: de as LandingFooterContent,
  en: en as LandingFooterContent,
};

export function getLandingFooterContent(locale: Locale): LandingFooterContent {
  const landingFooter = LANDING_FOOTER_CONTENT[locale];
  const homeFooter = getHomeSections(locale).find(
    (section) => section.id === "footer",
  );
  const homeContactColumn = homeFooter?.footerColumns.at(-1);
  const landingContactColumn = landingFooter.columns.at(-1);

  if (!homeContactColumn || !landingContactColumn) {
    throw new Error("Expected home footer contact column to be available.");
  }

  const contactColumn = {
    ...homeContactColumn,
    links: [...landingContactColumn.links, ...homeContactColumn.links],
  };

  return {
    ...landingFooter,
    columns: [...landingFooter.columns.slice(0, -1), contactColumn],
  };
}
