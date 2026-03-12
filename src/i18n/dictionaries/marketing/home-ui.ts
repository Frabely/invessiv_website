import type { Locale } from "@/config/i18n";

type IncludedContent = {
  bridge?: string;
  cards: Array<{ description: string; tag: string; title: string }>;
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
  servicesAddonBadgeLabel: string;
  servicesComingSoonExamplesCtaLabel: string;
  servicesComingSoonExamplesHideLabel: string;
  servicesComingSoonLabel: string;
  servicesFaqLinkLabel: string;
  servicesFitLabel: string;
  servicesMoreItemsPluralLabel: string;
  servicesMoreItemsSingularLabel: string;
  servicesOneTimeLabel: string;
  servicesRecommendedBadgeLabel: string;
  includedContent: IncludedContent;
  servicesDeliveryLabel: string;
  servicesDetailsCta: string;
  servicesPrimaryCta: string;
};

const HOME_UI_CONTENT: Record<Locale, HomeUiContent> = {
  de: {
    heroBenefitsAriaLabel: "Kurzvorteile",
    heroChipTags: [
      "Transparente Aufwandseinschätzung",
      "Ein Ansprechpartner",
      "QA vor Go-live",
    ],
    heroPrimaryCta: "Projekt anfragen",
    heroSecondaryCta: "Angebote & Preise",
    heroTag: "KLARER AUFBAU, DIREKTE UMSETZUNG",
    heroVisualAriaLabel: "Live Performance Einblick",
    mappingWarning: "Navigation/Section Mapping ist unvollständig.",
    includedContent: {
      title: "Vom ersten Rahmen bis zur Übergabe",
      summaryPoints: [
        "Empfehlung vor Start",
        "kurze Abstimmung",
        "QA & Übergabe",
      ],
      cards: [
        {
          title: "Passender Einstieg vor Projektbeginn",
          tag: "Setup",
          description:
            "Nach der Anfrage sortieren wir Ziel, Umfang und Angebotsform, bevor die Umsetzung losgeht.",
        },
        {
          title: "Kurze Wege im Projekt",
          tag: "Ablauf",
          description:
            "Fragen, Feedback und Prioritäten laufen ohne Umwege zwischen uns. Das spart Schleifen und hält Entscheidungen zügig.",
        },
        {
          title: "Launch sauber vorbereitet",
          tag: "QA",
          description:
            "Responsive Checks, technische SEO, QA und Übergabe sind von Anfang an eingeplant statt erst kurz vor Schluss.",
        },
      ],
      bridge:
        "Nach der Anfrage weißt du, welcher Einstieg sinnvoll ist und wie es konkret weitergeht.",
    },
    servicesAddonBadgeLabel: "Zusatzleistung",
    servicesComingSoonExamplesCtaLabel: "Was geplant ist",
    servicesComingSoonExamplesHideLabel: "Beispiele ausblenden",
    servicesComingSoonLabel: "Bald verfügbar",
    servicesFaqLinkLabel: "Fragen?",
    servicesFitLabel: "Ideal für",
    servicesMoreItemsPluralLabel: "weitere Punkte",
    servicesMoreItemsSingularLabel: "weiterer Punkt",
    servicesOneTimeLabel: "einmalig",
    servicesRecommendedBadgeLabel: "Empfohlen",
    servicesPrimaryCta: "Passendes Angebot anfragen",
    servicesDetailsCta: "Mehr Infos",
    servicesDeliveryLabel: "Typisch",
  },
  en: {
    heroBenefitsAriaLabel: "Key benefits",
    heroChipTags: [
      "Transparent effort estimate",
      "One point of contact",
      "QA before go-live",
    ],
    heroPrimaryCta: "Request project",
    heroSecondaryCta: "Offers & pricing",
    heroTag: "CLEAR STRUCTURE, DIRECT EXECUTION",
    heroVisualAriaLabel: "Live performance snapshot",
    mappingWarning: "Navigation/section mapping is incomplete.",
    includedContent: {
      title: "From first outline to handoff",
      summaryPoints: [
        "recommendation before kickoff",
        "short feedback loops",
        "QA & handover",
      ],
      cards: [
        {
          title: "Right entry point before kickoff",
          tag: "Setup",
          description:
            "After the inquiry, we sort the goal, project range, and offer format before implementation begins.",
        },
        {
          title: "Short paths during execution",
          tag: "Workflow",
          description:
            "Questions, feedback, and priorities move without detours between us. That cuts extra loops and keeps decisions moving.",
        },
        {
          title: "Launch prepared from the start",
          tag: "QA",
          description:
            "Responsive checks, technical SEO, QA, and handover are planned in from the start instead of being added at the end.",
        },
      ],
      bridge:
        "After the inquiry, you know which entry point makes sense and how the next step looks.",
    },
    servicesAddonBadgeLabel: "Add-on",
    servicesComingSoonExamplesCtaLabel: "What is planned",
    servicesComingSoonExamplesHideLabel: "Hide examples",
    servicesComingSoonLabel: "Coming soon",
    servicesFaqLinkLabel: "Questions?",
    servicesFitLabel: "Ideal for",
    servicesMoreItemsPluralLabel: "more items",
    servicesMoreItemsSingularLabel: "more item",
    servicesOneTimeLabel: "one-time",
    servicesRecommendedBadgeLabel: "Recommended",
    servicesPrimaryCta: "Request fitting offer",
    servicesDetailsCta: "More details",
    servicesDeliveryLabel: "Typical",
  },
};

export function getHomeUiContent(locale: Locale): HomeUiContent {
  return HOME_UI_CONTENT[locale];
}
