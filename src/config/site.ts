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

export type NavigationItem = {
  href: string;
};

export const PRIMARY_NAVIGATION_SECTION_IDS = [
  "included",
  "services",
  "process",
  "faq",
] as const;

export const PRIMARY_NAVIGATION: NavigationItem[] =
  PRIMARY_NAVIGATION_SECTION_IDS.map((sectionId) => ({
    href: `#${sectionId}`,
  }));

export const ENABLE_THEME_SWITCH = false;
