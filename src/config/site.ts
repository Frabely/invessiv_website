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
  href: `#${SectionId}`;
  label: string;
};

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  { href: "#proof", label: "Ergebnisse" },
  { href: "#services", label: "Leistungen & Preise" },
  { href: "#process", label: "Prozess" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Kontakt" },
];

export const ENABLE_THEME_SWITCH = false;
