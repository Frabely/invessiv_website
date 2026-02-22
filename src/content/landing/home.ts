import type { SectionId } from "@/config/site";

export type MetricItem = {
  label: string;
  value: string;
};

export type SectionCard = {
  title: string;
  description: string;
  points?: string[];
};

export type ProcessStep = {
  step: string;
  title: string;
  description: string;
};

export type LandingSection = {
  id: SectionId;
  eyebrow?: string;
  title: string;
  description: string;
  metrics?: MetricItem[];
  cards?: SectionCard[];
  steps?: ProcessStep[];
};

export const HOME_SECTIONS: LandingSection[] = [
  {
    id: "hero",
    eyebrow: "Invessiv Upgrade",
    title: "Mit wenig Zeitaufwand schnell zu einer fertigen Website.",
    description:
      "Du gibst nur den noetigen Input, wir uebernehmen den Rest: Landingpages, Webseiten und Prozess-Tools mit schneller Umsetzung bis zum produktiven Ergebnis.",
  },
  {
    id: "proof",
    title: "Ergebnisse statt Bauchgefuehl",
    description:
      "Jede Umsetzung wird auf klare Conversion-Ziele ausgerichtet und mit nachvollziehbaren KPI-Signalen bewertet.",
    metrics: [
      { label: "Time-to-First-Click", value: "5 Werktage" },
      { label: "Antwortgeschwindigkeit", value: "< 24h" },
      { label: "Durchschnittliche Conversion-Uplifts", value: "+18-42%" },
    ],
  },
  {
    id: "services",
    title: "Leistungen",
    description:
      "Modulare Services fuer Strategie, Umsetzung und Weiterentwicklung, ohne unklare Paketlogik.",
    cards: [
      {
        title: "Landingpage Sprint",
        description:
          "Schnelle Conversion-orientierte Seite mit klarer Offer-Story und CTA-Fokus.",
        points: ["Hero + Proof + Offer", "SEO-Basis", "Tracking-ready"],
      },
      {
        title: "Webseiten Upgrade",
        description:
          "Bestehende Seiten werden strukturell, visuell und technisch modernisiert.",
        points: ["IA-Refactor", "Performance-Tuning", "UX-Feinschliff"],
      },
      {
        title: "Growth Operations",
        description:
          "Kontinuierliche Optimierung mit Test-Routinen und priorisierten Backlogs.",
        points: ["Hypothesen-Backlog", "A/B-Ideen", "Monatliches Review"],
      },
    ],
  },
  {
    id: "process",
    title: "Prozess",
    description:
      "Die Zusammenarbeit bleibt schlank, transparent und auf schnelle Entscheidungen ausgelegt.",
    steps: [
      {
        step: "01",
        title: "Input sammeln",
        description: "Ziele, Zielgruppe, Angebot und Markenrahmen werden fokussiert geklaert.",
      },
      {
        step: "02",
        title: "Design + Struktur",
        description: "Informationsarchitektur und Hauptseiten werden in klaren Modulen aufgebaut.",
      },
      {
        step: "03",
        title: "Build + QA",
        description: "Next.js/Tailwind Umsetzung mit Tests fuer Kernlogik und Kernablaeufe.",
      },
      {
        step: "04",
        title: "Go-Live + Iteration",
        description: "Launch mit Monitoring, danach datengetriebene Optimierung.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pakete",
    description: "Transparente Pakete mit klarem Scope und nachvollziehbarer Lieferlogik.",
    cards: [
      {
        title: "Starter",
        description: "Fuer fokussierte Angebotsseiten mit schneller Markteinfuhrung.",
        points: ["1 Kernseite", "SEO-Grundlagen", "Launch-Support"],
      },
      {
        title: "Growth",
        description: "Fuer skalierende Services mit mehreren Journeys und CTA-Pfaden.",
        points: ["Mehrere Sections", "Tracking + Events", "Optimierungsrunde"],
      },
      {
        title: "Scale",
        description: "Fuer Teams mit hohem Anspruch an Geschwindigkeit und Betriebssicherheit.",
        points: ["Mehrsprachig vorbereitet", "A11y + Performance Fokus", "Roadmap-Betreuung"],
      },
    ],
  },
  {
    id: "contact",
    title: "Projekt anfragen",
    description:
      "Kurzer Anfragepfad mit klaren Kontaktkanaelen. Ziel ist ein schneller Start ohne Reibung.",
    cards: [
      {
        title: "Direktkontakt",
        description: "Antwort in der Regel innerhalb von 24 Stunden.",
        points: ["hello@invessiv.de", "+49 000 000000", "Mo-Fr 09:00-18:00"],
      },
      {
        title: "Projektfokus",
        description: "Wir starten mit Zielbild, Zeitrahmen und priorisiertem Scope.",
        points: ["Ziele", "Budgetrahmen", "Launch-Zeitpunkt"],
      },
    ],
  },
];
