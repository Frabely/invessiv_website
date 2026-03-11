import type { Locale } from "@/config/i18n";

type ProofContent = {
  cards: Array<{ description: string; tag: string; title: string }>;
  hint: string;
  kpis: Array<{ label: string; suffix: string; value: string }>;
  summaryPoints: string[];
  title: string;
};

export type HomeUiContent = {
  heroBenefitsAriaLabel: string;
  heroChipTags: string[];
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTag: string;
  heroVisualAriaLabel: string;
  mappingWarning: string;
  marqueeItems: string[];
  servicesAddonBadgeLabel: string;
  servicesComingSoonExamplesCtaLabel: string;
  servicesComingSoonExamplesHideLabel: string;
  servicesComingSoonLabel: string;
  servicesFaqLinkLabel: string;
  servicesMoreItemsPluralLabel: string;
  servicesMoreItemsSingularLabel: string;
  servicesOneTimeLabel: string;
  servicesRecommendedBadgeLabel: string;
  proofContent: ProofContent;
  servicesDeliveryLabel: string;
  servicesDetailsCta: string;
  servicesPrimaryCta: string;
};

const HOME_UI_CONTENT: Record<Locale, HomeUiContent> = {
  de: {
    heroBenefitsAriaLabel: "Kurzvorteile",
    heroChipTags: [
      "KI-Agenten-Workflow",
      "Manueller QA-Finalcheck",
      "In der Regel Antwort in 24h",
    ],
    heroPrimaryCta: "Projekt anfragen",
    heroSecondaryCta: "Leistungen ansehen",
    heroTag: "Individuell statt Baukasten",
    heroVisualAriaLabel: "Live Performance Einblick",
    mappingWarning: "Navigation/Section Mapping ist unvollständig.",
    marqueeItems: [
      "Landingpages",
      "Webseiten",
      "Prozess-Tools",
      "Website-Upgrades",
      "KI-Templates & Agents",
      "Wartung & Support",
      "Performance-Optimierung",
      "Technische SEO",
    ],
    proofContent: {
      cards: [
        {
          title: "Strukturierter Start statt Ratespiel",
          tag: "Strukturiert",
          description:
            "Du bekommst früh eine Struktur mit den nächsten Schritten statt langer Abstimmungsschleifen.",
        },
        {
          title: "Modernisieren statt unnötig neu bauen",
          tag: "Pragmatisch",
          description:
            "Bestehende Seiten und Prozesse werden gezielt verbessert, wenn ein kompletter Neubau nicht nötig ist.",
        },
        {
          title: "Umsetzung mit Fokus",
          tag: "Zielgerichtet",
          description:
            "Entscheidungen orientieren sich an deinem konkreten Ziel statt an reiner Optik oder Buzzwords.",
        },
      ],
      hint: "Du erhältst eine direkte Zusammenarbeit mit Fokus auf sinnvolle Umsetzung und saubere Übergabe.",
      summaryPoints: [
        "Klarer Scope und Ablauf ab Start",
        "Direkter Kontakt ohne Übergaben",
        "Fokus auf Output statt Abstimmung",
      ],
      kpis: [
        { value: "Klar", suffix: "", label: "Scope und Ablauf" },
        { value: "Effizient", suffix: "", label: "Abstimmung" },
        {
          value: "1",
          suffix: " Ansprechpartner",
          label: "Direkter Kontakt",
        },
      ],
      title: "So läuft die Zusammenarbeit ab",
    },
    servicesAddonBadgeLabel: "Zusatzleistung",
    servicesComingSoonExamplesCtaLabel: "Was geplant ist",
    servicesComingSoonExamplesHideLabel: "Beispiele ausblenden",
    servicesComingSoonLabel: "Bald verfügbar",
    servicesFaqLinkLabel: "Fragen?",
    servicesMoreItemsPluralLabel: "weitere Punkte",
    servicesMoreItemsSingularLabel: "weiterer Punkt",
    servicesOneTimeLabel: "einmalig",
    servicesRecommendedBadgeLabel: "Empfohlen",
    servicesPrimaryCta: "Projekt anfragen",
    servicesDetailsCta: "Mehr Infos",
    servicesDeliveryLabel: "Typisch",
  },
  en: {
    heroBenefitsAriaLabel: "Key benefits",
    heroChipTags: [
      "AI agent workflow",
      "Manual QA final check",
      "Typically a reply within 24h",
    ],
    heroPrimaryCta: "Request project",
    heroSecondaryCta: "View services",
    heroTag: "Custom instead of templates",
    heroVisualAriaLabel: "Live performance snapshot",
    mappingWarning: "Navigation/section mapping is incomplete.",
    marqueeItems: [
      "Landing pages",
      "Websites",
      "Process tools",
      "Website upgrades",
      "AI templates & agents",
      "Maintenance & support",
      "Performance optimization",
      "Technical SEO",
    ],
    proofContent: {
      cards: [
        {
          title: "Structured start instead of guesswork",
          tag: "Structured",
          description:
            "You get an early structure with next steps instead of long alignment loops.",
        },
        {
          title: "Improve before rebuilding",
          tag: "Practical",
          description:
            "Existing pages and processes are improved where possible instead of rebuilding everything.",
        },
        {
          title: "Execution with focus",
          tag: "Goal-driven",
          description:
            "Decisions are driven by your concrete project goal, not by visuals or buzzwords alone.",
        },
      ],
      hint: "You get direct collaboration and implementation with clean handover.",
      summaryPoints: [
        "Clear scope and process from day one",
        "Direct contact without handoff loops",
        "Execution focus over meeting overhead",
      ],
      kpis: [
        { value: "Clear", suffix: "", label: "Scope and process" },
        { value: "Efficient", suffix: "", label: "Alignment" },
        { value: "1", suffix: " contact person", label: "Direct contact" },
      ],
      title: "How the collaboration works",
    },
    servicesAddonBadgeLabel: "Add-on",
    servicesComingSoonExamplesCtaLabel: "What is planned",
    servicesComingSoonExamplesHideLabel: "Hide examples",
    servicesComingSoonLabel: "Coming soon",
    servicesFaqLinkLabel: "Questions?",
    servicesMoreItemsPluralLabel: "more items",
    servicesMoreItemsSingularLabel: "more item",
    servicesOneTimeLabel: "one-time",
    servicesRecommendedBadgeLabel: "Recommended",
    servicesPrimaryCta: "Request project",
    servicesDetailsCta: "More details",
    servicesDeliveryLabel: "Typical",
  },
};

export function getHomeUiContent(locale: Locale): HomeUiContent {
  return HOME_UI_CONTENT[locale];
}
