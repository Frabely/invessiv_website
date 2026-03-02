import type { Locale } from "@/config/i18n";

type ProofContent = {
  cards: Array<{ description: string; tag: string; title: string }>;
  hint: string;
  kpis: Array<{ label: string; suffix: string; value: string }>;
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
  proofContent: ProofContent;
  servicesDeliveryLabel: string;
  servicesDetailsCta: string;
  servicesPrimaryCta: string;
};

const HOME_UI_CONTENT: Record<Locale, HomeUiContent> = {
  de: {
    heroBenefitsAriaLabel: "Kurzvorteile",
    heroChipTags: ["Figma-Design inkl.", "Launch in Tagen", "Antwort < 24h"],
    heroPrimaryCta: "Projekt anfragen",
    heroSecondaryCta: "Leistungen ansehen",
    heroTag: "Individuell statt Baukasten",
    heroVisualAriaLabel: "Live Performance Einblick",
    mappingWarning: "Navigation/Section Mapping ist unvollstaendig.",
    marqueeItems: [
      "B2B Services",
      "Growth Ops",
      "Lead Funnels",
      "CRO Sprints",
      "SEO Grundlagen",
      "Paid + Organic",
      "CRM Integrationen",
      "Tracking Klarheit",
    ],
    proofContent: {
      cards: [
        {
          title: "Time-to-Launch SLA",
          tag: "Fast",
          description:
            "Erste klickbare Version in 5 Werktagen, klarer Go-live Plan je Paket.",
        },
        {
          title: "Upgrade statt Neubau",
          tag: "Lean",
          description:
            "Bestehende Seiten werden gezielt modernisiert, ohne alles neu aufzusetzen.",
        },
        {
          title: "KPI-orientiert",
          tag: "Measured",
          description:
            "Vorab definierte Ziele wie Ladezeit, Leads oder Conversion statt nur Design-Output.",
        },
      ],
      hint: "Der Fokus liegt auf schneller Lieferung, wenig Aufwand fuer den Kaeufer und messbaren Ergebnissen.",
      kpis: [
        { value: "5", suffix: " Tage", label: "Time-to-first-draft" },
        { value: "92", suffix: "%", label: "Briefing-Aufwand reduziert" },
        {
          value: "1",
          suffix: " Ansprechpartner",
          label: "Klarer Delivery-Owner",
        },
      ],
      title: "Warum nicht wie eine Standard-Template-Seite?",
    },
    servicesPrimaryCta: "Projekt anfragen",
    servicesDetailsCta: "Mehr Infos",
    servicesDeliveryLabel: "Lieferzeit",
  },
  en: {
    heroBenefitsAriaLabel: "Key benefits",
    heroChipTags: ["Figma design included", "Launch in days", "Reply < 24h"],
    heroPrimaryCta: "Request project",
    heroSecondaryCta: "View services",
    heroTag: "Custom instead of templates",
    heroVisualAriaLabel: "Live performance snapshot",
    mappingWarning: "Navigation/section mapping is incomplete.",
    marqueeItems: [
      "B2B Services",
      "Growth Ops",
      "Lead Funnels",
      "CRO Sprints",
      "SEO Foundations",
      "Paid + Organic",
      "CRM Integrations",
      "Tracking Clarity",
    ],
    proofContent: {
      cards: [
        {
          title: "Time-to-launch SLA",
          tag: "Fast",
          description:
            "First clickable version in 5 business days with a clear go-live plan per package.",
        },
        {
          title: "Upgrade over rebuild",
          tag: "Lean",
          description:
            "Existing pages are modernized surgically without forcing a full rebuild.",
        },
        {
          title: "KPI-oriented",
          tag: "Measured",
          description:
            "Predefined targets like speed, leads, and conversion instead of design output only.",
        },
      ],
      hint: "The focus is fast delivery, low buyer effort, and measurable outcomes.",
      kpis: [
        { value: "5", suffix: " days", label: "Time-to-first-draft" },
        { value: "92", suffix: "%", label: "Briefing effort reduced" },
        { value: "1", suffix: " owner", label: "Clear delivery owner" },
      ],
      title: "Why not build it like a generic template site?",
    },
    servicesPrimaryCta: "Request project",
    servicesDetailsCta: "More details",
    servicesDeliveryLabel: "Delivery time",
  },
};

export function getHomeUiContent(locale: Locale): HomeUiContent {
  return HOME_UI_CONTENT[locale];
}
