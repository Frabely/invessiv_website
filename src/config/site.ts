export const SECTION_IDS = [
  "hero",
  "proof",
  "services",
  "process",
  "pricing",
  "contact",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export type NavigationItem = {
  href: `#${SectionId}`;
  label: string;
};

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  { href: "#proof", label: "Ergebnisse" },
  { href: "#services", label: "Leistungen" },
  { href: "#process", label: "Prozess" },
  { href: "#pricing", label: "Pakete" },
  { href: "#contact", label: "Kontakt" },
];
