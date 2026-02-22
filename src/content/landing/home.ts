import type { SectionId } from "@/config/site";
import type { Locale } from "@/config/i18n";

export type LandingSectionCopy = {
  title: string;
  description: string;
  metrics?: Array<{ label: string; value: string }>;
  cards?: Array<{ title: string; description: string; tag: string }>;
  serviceCards?: Array<{
    icon?: string;
    iconSrc?: string;
    iconAlt?: string;
    title: string;
    description: string;
    tag: string;
    bullets?: string[];
    chips?: string[];
    span?: 4 | 5 | 6 | 7;
    visualVariant?: "landing" | "upgrade" | "ai";
    visual?: boolean;
  }>;
};

export type LandingSection = {
  id: SectionId;
  copy: Record<Locale, LandingSectionCopy>;
};

const HOME_SECTIONS: LandingSection[] = [
  {
    id: "hero",
    copy: {
      de: {
        title: "Mit wenig Zeitaufwand schnell zu einer fertigen Website.",
        description:
          "Du gibst nur den noetigen Input, wir uebernehmen den Rest: Landingpages, Webseiten und Prozess-Tools mit schneller Umsetzung bis zum produktiven Ergebnis.",
      },
      en: {
        title: "Ship a finished website fast with minimal time investment.",
        description:
          "You provide the required input, we handle the rest: landing pages, websites, and process tools delivered quickly to production-ready quality.",
      },
    },
  },
  {
    id: "proof",
    copy: {
      de: {
        title: "Proof",
        description: "Messbare Ergebnisse und klare Delivery-Signale statt Bauchgefuehl.",
        metrics: [
          { label: "Time-to-first-draft", value: "5 Tage" },
          { label: "Briefing-Aufwand reduziert", value: "92%" },
          { label: "Delivery-Owner", value: "1 Ansprechpartner" },
        ],
        cards: [
          {
            title: "Time-to-Launch SLA",
            description:
              "Erste klickbare Version in 5 Werktagen mit klarem Go-live-Plan je Paket.",
            tag: "Fast",
          },
          {
            title: "Upgrade statt Neubau",
            description:
              "Bestehende Seiten werden gezielt modernisiert, ohne alles neu aufzusetzen.",
            tag: "Lean",
          },
          {
            title: "KPI-orientiert",
            description:
              "Vorab definierte Ziele wie Ladezeit, Leads oder Conversion statt nur Design-Output.",
            tag: "Measured",
          },
        ],
      },
      en: {
        title: "Proof",
        description: "Measurable outcomes and clear delivery signals instead of guesswork.",
        metrics: [
          { label: "Time-to-first-draft", value: "5 days" },
          { label: "Briefing effort reduced", value: "92%" },
          { label: "Delivery owner", value: "1 point of contact" },
        ],
        cards: [
          {
            title: "Time-to-launch SLA",
            description:
              "First clickable version in 5 business days with a clear go-live plan per package.",
            tag: "Fast",
          },
          {
            title: "Upgrade over rebuild",
            description:
              "Existing pages are modernized surgically without forcing a full rebuild.",
            tag: "Lean",
          },
          {
            title: "KPI-oriented",
            description:
              "Predefined targets like speed, leads, and conversion instead of design output only.",
            tag: "Measured",
          },
        ],
      },
    },
  },
  {
    id: "services",
    copy: {
      de: {
        title: "Unsere Leistungen",
        description:
          "Schlanker Start mit fuenf klaren Angebotsbereichen im gleichen Delivery-Rhythmus.",
        serviceCards: [
          {
            iconSrc: "/services/01-landingpages-target.png",
            iconAlt: "Landingpages Icon",
            title: "Landingpages",
            description:
              "Conversion-optimierte One-Pager mit klarer Botschaft und starker Performance.",
            tag: "Beispiel folgt",
            visual: true,
            visualVariant: "landing",
            span: 4,
          },
          {
            iconSrc: "/services/02-webseiten-screen-no-stand.png",
            iconAlt: "Webseiten Icon",
            title: "Webseiten",
            description:
              "Individuelle Firmenwebseiten mit moderner Struktur und klarer Navigation.",
            tag: "Beispiel folgt",
            chips: ["SEO-ready", "Mobile-first", "Schnell"],
            span: 4,
          },
          {
            iconSrc: "/services/03-prozess-tools-gears.png",
            iconAlt: "Prozess-Tools Icon",
            title: "Prozess-Tools",
            description:
              "Automatisierung interner Ablaeufe und effiziente Mini-Tools.",
            tag: "Beispiel folgt",
            bullets: ["Mini-Portale", "Workflow-Automation", "Status-Transparenz"],
            span: 4,
          },
          {
            iconSrc: "/services/04-upgrade-refresh-screen.png",
            iconAlt: "Website-Upgrade Icon",
            title: "Alte Website upgraden",
            description:
              "Bestehende Webseiten modernisieren und optimieren.",
            tag: "Beispiel folgt",
            visual: true,
            visualVariant: "upgrade",
            span: 6,
          },
          {
            iconSrc: "/services/05-ki-templates-brain-cards.png",
            iconAlt: "KI-Templates Icon",
            title: "KI-Templates",
            description: "Vorgefertigte AI-Templates fuer Content-Erstellung und Marketing.",
            tag: "Beispiel folgt",
            bullets: ["Texte & Bilder", "Landingpages", "Social Media Posts"],
            visual: true,
            visualVariant: "ai",
            span: 6,
          },
        ],
      },
      en: {
        title: "Our Services",
        description:
          "A focused start with five clear offer areas in the same delivery rhythm.",
        serviceCards: [
          {
            iconSrc: "/services/01-landingpages-target.png",
            iconAlt: "Landing pages icon",
            title: "Landing pages",
            description:
              "Conversion-optimized one-pagers with clear messaging and strong performance.",
            tag: "Example coming soon",
            visual: true,
            visualVariant: "landing",
            span: 4,
          },
          {
            iconSrc: "/services/02-webseiten-screen-no-stand.png",
            iconAlt: "Websites icon",
            title: "Websites",
            description:
              "Custom company websites with modern structure and clean navigation.",
            tag: "Example coming soon",
            chips: ["SEO-ready", "Mobile-first", "Fast"],
            span: 4,
          },
          {
            iconSrc: "/services/03-prozess-tools-gears.png",
            iconAlt: "Process tools icon",
            title: "Process tools",
            description:
              "Automation of internal workflows and efficient mini tools.",
            tag: "Example coming soon",
            bullets: ["Mini portals", "Workflow automation", "Status visibility"],
            span: 4,
          },
          {
            iconSrc: "/services/04-upgrade-refresh-screen.png",
            iconAlt: "Website upgrade icon",
            title: "Upgrade existing website",
            description:
              "Modernize and optimize your existing websites.",
            tag: "Example coming soon",
            visual: true,
            visualVariant: "upgrade",
            span: 6,
          },
          {
            iconSrc: "/services/05-ki-templates-brain-cards.png",
            iconAlt: "AI templates icon",
            title: "AI templates",
            description: "Prebuilt AI templates for content creation and marketing.",
            tag: "Example coming soon",
            bullets: ["Texts & images", "Landing pages", "Social media posts"],
            visual: true,
            visualVariant: "ai",
            span: 6,
          },
        ],
      },
    },
  },
  {
    id: "process",
    copy: {
      de: {
        title: "Prozess",
        description:
          "Der Delivery-Track wird als klare Timeline umgesetzt: von Input ueber Draft bis Go-live.",
      },
      en: {
        title: "Process",
        description:
          "The delivery track will be implemented as a clear timeline from input and draft to go-live.",
      },
    },
  },
  {
    id: "pricing",
    copy: {
      de: {
        title: "Pakete",
        description:
          "Pakete werden transparent und vergleichbar mit klaren Scopes und CTA-Pfaden dargestellt.",
      },
      en: {
        title: "Packages",
        description:
          "Packages will be displayed transparently with comparable scopes and clear CTA paths.",
      },
    },
  },
  {
    id: "contact",
    copy: {
      de: {
        title: "Kontakt",
        description:
          "Der Anfrageflow wird als kurzer, klarer Conversion-Pfad mit belastbaren Zielzustaenden umgesetzt.",
      },
      en: {
        title: "Contact",
        description:
          "The request flow will be implemented as a short, clear conversion path with reliable target states.",
      },
    },
  },
];

export function getHomeSections(locale: Locale) {
  return HOME_SECTIONS.map((section) => ({
    id: section.id,
    ...section.copy[locale],
  }));
}
