import type { SectionId } from "@/config/site";
import type { Locale } from "@/config/i18n";

export type LandingSectionCopy = {
  title: string;
  description: string;
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
          "Diese Sektion wird im naechsten Schritt mit belastbaren Cases, Kennzahlen und Social-Proof-Modulen ausgebaut.",
      },
      en: {
        title: "Proof",
        description:
          "This section will be expanded next with measurable cases, performance metrics, and social-proof modules.",
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
