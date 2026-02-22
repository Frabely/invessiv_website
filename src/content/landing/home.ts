import type { SectionId } from "@/config/site";
import type { Locale } from "@/config/i18n";

export type LandingSectionCopy = {
  title: string;
  description: string;
  metrics?: Array<{ label: string; value: string }>;
  cards?: Array<{ title: string; description: string; tag: string }>;
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
        title: "Leistungen",
        description:
          "Service-Module fuer Landingpages, Webseiten und Prozess-Tools werden sectionweise im Mockup-Stil aufgebaut.",
      },
      en: {
        title: "Services",
        description:
          "Service modules for landing pages, websites, and process tools will be built section-by-section in the mockup style.",
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
