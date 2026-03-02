export const SECTION_IDS = [
  "hero",
  "proof",
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

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  { href: "#proof" },
  { href: "#services" },
  { href: "#process" },
  { href: "#faq" },
  { href: "#contact" },
];

export const ENABLE_THEME_SWITCH = false;
