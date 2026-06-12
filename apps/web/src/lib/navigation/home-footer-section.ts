import { FOOTER_SECTION_ID } from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import {
  type FooterColumnCopy,
  getHomeSections,
} from "@/i18n/dictionaries/marketing/home";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import type { Locale } from "@/config/i18n";

type HomeFooterSectionContent = {
  description: string;
  navColumn: FooterColumnCopy;
};

export function getHomeFooterSectionContent(
  locale: Locale,
): HomeFooterSectionContent | null {
  const footerSection = getHomeSections(locale).find(
    (section) => section.id === FOOTER_SECTION_ID,
  );

  if (!footerSection) {
    return null;
  }

  const homePath = createLocalePathname(SITE_ROUTES.HOME, locale);

  return {
    description: footerSection.description,
    navColumn: {
      ...footerSection.navColumn,
      links: footerSection.navColumn.links.map((link) => ({
        ...link,
        href: link.href.startsWith("#") ? `${homePath}${link.href}` : link.href,
      })),
    },
  };
}
