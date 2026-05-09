import type { LeadSocialPlatform } from "@/common/constants/leads/social/lead-social-platforms";
import type { Locale } from "@/config/i18n";
import { LANDING_NAVIGATION } from "@/config/navigation/landing";
import { getHomeSections } from "@/i18n/dictionaries/marketing/home";
import { getLandingHeaderContent } from "@/i18n/dictionaries/landing/header";
import de from "./de.json";
import en from "./en.json";

type LandingFooterColumn = {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

type LandingFooterSourceColumn = {
  title: string;
  links?: LandingFooterColumn["links"];
};

export type LandingFooterContent = {
  bottomNote?: string;
  brand: string;
  columns: LandingFooterColumn[];
  copyright: string;
  description: string;
  legalLinks: Array<{
    label: string;
    href: string;
  }>;
  socialLinks: Array<{
    platform: LeadSocialPlatform;
    href: string;
    label: string;
  }>;
};

type LandingFooterSourceContent = Omit<LandingFooterContent, "columns"> & {
  columns: LandingFooterSourceColumn[];
};

const LANDING_FOOTER_CONTENT: Record<Locale, LandingFooterSourceContent> = {
  de: de as LandingFooterSourceContent,
  en: en as LandingFooterSourceContent,
};

export function getLandingFooterContent(locale: Locale): LandingFooterContent {
  const landingFooter = LANDING_FOOTER_CONTENT[locale];
  const landingHeader = getLandingHeaderContent(locale);
  const homeFooter = getHomeSections(locale).find(
    (section) => section.id === "footer",
  );
  const [landingMenuColumn, ...landingFooterColumns] = landingFooter.columns;
  const homeContactColumn = homeFooter?.footerColumns.at(-1);
  const landingContactColumn = landingFooterColumns.at(-1);

  if (!landingMenuColumn || !homeContactColumn || !landingContactColumn) {
    throw new Error("Expected home footer contact column to be available.");
  }

  const menuColumn = {
    ...landingMenuColumn,
    links: LANDING_NAVIGATION.map((item) => ({
      href: item.href,
      label: landingHeader.labelsByHref[item.href] ?? item.href,
    })),
  };
  const contactColumn = {
    ...homeContactColumn,
    links: [...(landingContactColumn.links ?? []), ...homeContactColumn.links],
  };
  const middleColumns = landingFooterColumns.slice(0, -1).map((column) => ({
    ...column,
    links: column.links ?? [],
  }));

  return {
    ...landingFooter,
    columns: [menuColumn, ...middleColumns, contactColumn],
  };
}
