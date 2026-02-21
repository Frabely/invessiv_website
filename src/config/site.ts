export const siteConfig = {
  name: "invessiv",
  description:
    "Digitale Roadmaps und Agent-Blueprints fuer moderne Service-Websites.",
  primaryCta: "Kostenloses Erstgespraech buchen",
  secondaryCta: "Projekt anfragen",
};

export const mainNavigation = [
  { href: "/", label: "Start" },
  { href: "/leistungen", label: "Leistungen" },
  { href: "/vorlagen", label: "Vorlagen" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

export const legalNavigation = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
] as const;
