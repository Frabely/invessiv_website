import type { Locale } from "@/config/i18n";

export const SECTION_IDS = [
  "hero",
  "lead-bridge",
  "services",
  "proof",
  "process",
  "faq",
  "contact",
  "footer",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type SectionHref = `#${SectionId}`;

export const [
  HERO_SECTION_ID,
  LEAD_BRIDGE_SECTION_ID,
  SERVICES_SECTION_ID,
  PROOF_SECTION_ID,
  PROCESS_SECTION_ID,
  FAQ_SECTION_ID,
  CONTACT_SECTION_ID,
  FOOTER_SECTION_ID,
] = SECTION_IDS;

export const SECTION_HREFS = {
  hero: "#hero",
  "lead-bridge": "#lead-bridge",
  proof: "#proof",
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
  "lead-bridge",
  "services",
  "process",
  "faq",
] as const;

export const PRIMARY_NAVIGATION: NavigationItem[] =
  PRIMARY_NAVIGATION_SECTION_IDS.map((sectionId) => ({
    href: getSectionHref(sectionId),
  }));
