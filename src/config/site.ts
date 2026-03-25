import type { Locale } from "@/config/i18n";

export const SECTION_IDS = [
  "hero",
  "included",
  "services",
  "process",
  "faq",
  "contact",
  "footer",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type SectionHref = `#${SectionId}`;

export const SECTION_HREFS = {
  hero: "#hero",
  included: "#included",
  services: "#services",
  process: "#process",
  faq: "#faq",
  contact: "#contact",
  footer: "#footer",
} as const satisfies Record<SectionId, SectionHref>;

export type NavigationItem = {
  href: string;
};

export const getSectionHref = (sectionId: SectionId): SectionHref =>
  SECTION_HREFS[sectionId];

export const getLocalizedSectionHref = (locale: Locale, sectionId: SectionId) =>
  `/${locale}${getSectionHref(sectionId)}`;

export const PRIMARY_NAVIGATION_SECTION_IDS = [
  "included",
  "services",
  "process",
  "faq",
] as const;

export const PRIMARY_NAVIGATION: NavigationItem[] =
  PRIMARY_NAVIGATION_SECTION_IDS.map((sectionId) => ({
    href: getSectionHref(sectionId),
  }));

export const ENABLE_THEME_SWITCH = false;
