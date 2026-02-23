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
  processSteps?: Array<{
    step: string;
    title: string;
    deliverable?: string;
    effort?: string;
    result?: string;
    description: string;
  }>;
  processSummary?: string;
  processRoles?: Array<{
    label: string;
    items: string[];
  }>;
  processCta?: {
    label: string;
    hint: string;
    href: string;
  };
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
        description:
          "Messbare Ergebnisse und klare Delivery-Signale statt Bauchgefuehl.",
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
        description:
          "Measurable outcomes and clear delivery signals instead of guesswork.",
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
            iconSrc: "/services/01_landingpages.png",
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
            iconSrc: "/services/02_websites.png",
            iconAlt: "Webseiten Icon",
            title: "Webseiten",
            description:
              "Individuelle Firmenwebseiten mit moderner Struktur und klarer Navigation.",
            tag: "Beispiel folgt",
            chips: ["SEO-ready", "Mobile-first", "Schnell"],
            span: 4,
          },
          {
            iconSrc: "/services/03_tools.png",
            iconAlt: "Prozess-Tools Icon",
            title: "Prozess-Tools",
            description:
              "Automatisierung interner Ablaeufe und effiziente Mini-Tools.",
            tag: "Beispiel folgt",
            bullets: [
              "Mini-Portale",
              "Workflow-Automation",
              "Status-Transparenz",
            ],
            span: 4,
          },
          {
            iconSrc: "/services/04_website_upgrade.png",
            iconAlt: "Website-Upgrade Icon",
            title: "Alte Website upgraden",
            description: "Bestehende Webseiten modernisieren und optimieren.",
            tag: "Beispiel folgt",
            visual: true,
            visualVariant: "upgrade",
            span: 6,
          },
          {
            iconSrc: "/services/05_ai_tempaltes.png",
            iconAlt: "KI-Templates Icon",
            title: "KI-Templates",
            description:
              "Vorgefertigte AI-Templates fuer Content-Erstellung und Marketing.",
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
            iconSrc: "/services/01_landingpages.png",
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
            iconSrc: "/services/02_websites.png",
            iconAlt: "Websites icon",
            title: "Websites",
            description:
              "Custom company websites with modern structure and clean navigation.",
            tag: "Example coming soon",
            chips: ["SEO-ready", "Mobile-first", "Fast"],
            span: 4,
          },
          {
            iconSrc: "/services/03_tools.png",
            iconAlt: "Process tools icon",
            title: "Process tools",
            description:
              "Automation of internal workflows and efficient mini tools.",
            tag: "Example coming soon",
            bullets: [
              "Mini portals",
              "Workflow automation",
              "Status visibility",
            ],
            span: 4,
          },
          {
            iconSrc: "/services/04_website_upgrade.png",
            iconAlt: "Website upgrade icon",
            title: "Upgrade existing website",
            description: "Modernize and optimize your existing websites.",
            tag: "Example coming soon",
            visual: true,
            visualVariant: "upgrade",
            span: 6,
          },
          {
            iconSrc: "/services/05_ai_tempaltes.png",
            iconAlt: "AI templates icon",
            title: "AI templates",
            description:
              "Prebuilt AI templates for content creation and marketing.",
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
        title: "In 4 Schritten zum fertigen Ergebnis",
        description:
          "Ob Landingpage, komplette Website, Upgrade oder Tool/Template: Du gibst Ziel und Angebot vor, wir liefern Draft, Feinschliff und Launch.",
        processSummary:
          "Typisch: erste Version in 48h (je nach Scope) | 1-2 Feedbackrunden | Go-live oder Uebergabe inklusive QA",
        processRoles: [
          {
            label: "Du lieferst",
            items: ["Ziel", "Angebot", "Assets"],
          },
          {
            label: "Wir liefern",
            items: [
              "Struktur + Copy/Design",
              "Setup + QA",
              "Launch + Uebergabe-Doku",
            ],
          },
        ],
        processSteps: [
          {
            step: "01",
            title: "Briefing & Input",
            deliverable: "30-min Briefing",
            effort: "Aufwand: 30 Min",
            result: "Ergebnis: Klarer Scope + Prioritaeten",
            description:
              "Du teilst Ziel, Angebot und Material. Wir setzen sofort die klare Umsetzungsbasis auf.",
          },
          {
            step: "02",
            title: "Draft",
            deliverable: "Klickbarer Draft oder Prototyp",
            effort: "Lieferzeit: meist 48h",
            result: "Ergebnis: Struktur + Kernlogik",
            description:
              "Du bekommst eine erste Version mit klarer Struktur, Inhalt und - falls noetig - funktionalem Prototyp.",
          },
          {
            step: "03",
            title: "Feinschliff",
            deliverable: "Conversion-Finish",
            effort: "Feedback: 1-2 Runden",
            result: "Ergebnis: Finales Design + Funktionen",
            description:
              "Design, Copy, UX-Details und relevante Funktionen werden gezielt finalisiert.",
          },
          {
            step: "04",
            title: "Go-live",
            deliverable: "Launch + Uebergabe",
            effort: "QA: finaler Check",
            result: "Ergebnis: Livegang oder Integrations-Uebergabe",
            description:
              "Nach QA geht das Projekt live oder wird sauber in deine Systeme uebergeben.",
          },
        ],
        processCta: {
          label: "Kostenlosen Kickoff Call buchen",
          hint: "Unverbindlich. Antwort in 24h.",
          href: "#contact",
        },
      },
      en: {
        title: "A finished result in 4 clear steps",
        description:
          "For landing pages, full websites, upgrades, or tools/templates: you share goal and offer, we deliver draft, refinement, and launch.",
        processSummary:
          "Typical: first version in 48h (depending on scope) | 1-2 feedback rounds | go-live or handover including QA",
        processRoles: [
          {
            label: "You provide",
            items: ["Goal", "Offer", "Assets"],
          },
          {
            label: "We deliver",
            items: [
              "Structure + copy/design",
              "Setup + QA",
              "Launch + handover docs",
            ],
          },
        ],
        processSteps: [
          {
            step: "01",
            title: "Briefing & Input",
            deliverable: "30-min briefing",
            effort: "Effort: 30 min",
            result: "Outcome: clear scope + priorities",
            description:
              "You share goals, offer, and materials. We set up a clear delivery foundation right away.",
          },
          {
            step: "02",
            title: "Draft",
            deliverable: "Clickable draft or prototype",
            effort: "Delivery: usually 48h",
            result: "Outcome: structure + core logic",
            description:
              "You get an initial version with clear structure, content, and functional prototype where needed.",
          },
          {
            step: "03",
            title: "Refinement",
            deliverable: "Conversion finish",
            effort: "Feedback: 1-2 rounds",
            result: "Outcome: final design + functions",
            description:
              "Design, copy, UX details, and relevant functions are finalized into the launch version.",
          },
          {
            step: "04",
            title: "Go live",
            deliverable: "Launch + handover",
            effort: "QA: final check",
            result: "Outcome: go-live or integration handover",
            description:
              "After QA, the project goes live or is handed over cleanly for integration in your setup.",
          },
        ],
        processCta: {
          label: "Book a free kickoff call",
          hint: "No commitment. Reply within 24h.",
          href: "#contact",
        },
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
