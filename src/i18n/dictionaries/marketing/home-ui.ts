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
      "Klare Scope-Einschätzung",
      "Ein Ansprechpartner",
      "QA vor Go-live",
    ],
    heroPrimaryCta: "Projekt anfragen",
    heroSecondaryCta: "Angebote & Preise",
    heroTag: "KLARER AUFBAU, DIREKTE UMSETZUNG",
    heroVisualAriaLabel: "Live Performance Einblick",
    mappingWarning: "Navigation/Section Mapping ist unvollständig.",
    includedContent: {
      title: "Klarer Rahmen, saubere Umsetzung",
      summaryPoints: [
        "Empfehlung vor Start",
        "direkte Abstimmung",
        "QA & Übergabe",
      ],
      cards: [
        {
          title: "Scope vor dem Start",
          tag: "Setup",
          description:
            "Nach der Anfrage klären wir Ziel, Umfang und das passende Angebot, bevor die Umsetzung startet.",
        },
        {
          title: "Direkte Abstimmung im Projekt",
          tag: "Ablauf",
          description:
            "Fragen, Feedback und Prioritäten laufen direkt zwischen uns. Das spart Schleifen und hält Entscheidungen kurz.",
        },
        {
          title: "Launchbereit übergeben",
          tag: "QA",
          description:
            "Responsive Checks, technische SEO, QA und Übergabe sind vor dem Launch eingeplant, nicht erst am Ende.",
        },
      ],
      bridge:
        "Nach der Anfrage ist schnell klar, welcher Einstieg passt und was der nächste Schritt ist.",
    },
    servicesAddonBadgeLabel: "Zusatzleistung",
    servicesComingSoonExamplesCtaLabel: "Was geplant ist",
    servicesComingSoonExamplesHideLabel: "Beispiele ausblenden",
    servicesComingSoonLabel: "Bald verfügbar",
    servicesFaqLinkLabel: "Fragen?",
    servicesFitLabel: "Passt gut für",
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
      "Clear scope assessment",
      "One point of contact",
      "QA before go-live",
    ],
    heroPrimaryCta: "Request project",
    heroSecondaryCta: "Offers & pricing",
    heroTag: "CLEAR STRUCTURE, DIRECT EXECUTION",
    heroVisualAriaLabel: "Live performance snapshot",
    mappingWarning: "Navigation/section mapping is incomplete.",
    includedContent: {
      title: "Clear scope, clean execution",
      summaryPoints: [
        "recommendation before kickoff",
        "direct feedback",
        "QA & handover",
      ],
      cards: [
        {
          title: "Scope aligned before kickoff",
          tag: "Setup",
          description:
            "After the inquiry, we align on goal, scope, and the right offer before implementation starts.",
        },
        {
          title: "Direct feedback during execution",
          tag: "Workflow",
          description:
            "Questions, feedback, and priorities run directly between us. That keeps decisions short and avoids extra loops.",
        },
        {
          title: "Handed over launch-ready",
          tag: "QA",
          description:
            "Responsive checks, technical SEO, QA, and handover are planned before launch, not added at the end.",
        },
      ],
      bridge:
        "After the inquiry, it quickly becomes clear which entry point fits and what the next step is.",
    },
    servicesAddonBadgeLabel: "Add-on",
    servicesComingSoonExamplesCtaLabel: "What is planned",
    servicesComingSoonExamplesHideLabel: "Hide examples",
    servicesComingSoonLabel: "Coming soon",
    servicesFaqLinkLabel: "Questions?",
    servicesFitLabel: "Best for",
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
