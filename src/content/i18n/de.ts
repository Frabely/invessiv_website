import { SiteDictionary } from "@/content/i18n/types";

export const deDictionary: SiteDictionary = {
  navigation: {
    main: [
      { href: "/", label: "Start" },
      { href: "/leistungen", label: "Leistungen" },
      { href: "/vorlagen", label: "Vorlagen" },
      { href: "/kontakt", label: "Kontakt" },
    ],
    legal: [
      { href: "/impressum", label: "Impressum" },
      { href: "/datenschutz", label: "Datenschutz" },
    ],
  },
  cta: {
    primary: "Kostenloses Erstgespraech buchen",
    secondary: "Projekt anfragen",
  },
  preferences: {
    theme: {
      light: "Hell",
      dark: "Dunkel",
      label: "Farbschema",
    },
    language: {
      label: "Sprache",
      de: "Deutsch",
      en: "Englisch",
    },
  },
  pages: {
    home: {
      metaTitle: "Start | invessiv",
      metaDescription:
        "Mehrseitige Website-Struktur fuer skalierbare Landing- und Produktseiten.",
      badge: "Next.js Foundation",
      title:
        "Mehrseitige Website-Struktur fuer skalierbare Landing- und Produktseiten.",
      description:
        "Diese Basis trennt Marketingseiten, Legal-Seiten und Shared Komponenten klar voneinander.",
      foundationHeading: "Architekturprinzipien fuer nachhaltige Weiterentwicklung",
      foundationItems: [
        {
          title: "Klare Trennung nach Verantwortlichkeiten",
          description:
            "Marketing-, Legal- und Shared-Bereiche werden isoliert, damit Wachstum nicht in technischem Wildwuchs endet.",
        },
        {
          title: "Content zentral statt verstreut",
          description:
            "Texte und Kernaussagen liegen in Config-Dateien und werden in Komponenten nur gerendert.",
        },
        {
          title: "Struktur, die skaliert",
          description:
            "Neue Features kommen als Module dazu, statt bestehende Ordner zu ueberladen.",
        },
      ],
      flowHeading: "Vorgehen in kleinen, belastbaren Inkrementen",
      flowSteps: [
        "Scope und Zielbild festlegen",
        "Design- und Content-System definieren",
        "Feature-orientiert implementieren",
        "Tests, Review und kontrollierter Release",
      ],
    },
    leistungen: {
      metaTitle: "Leistungen | invessiv",
      metaDescription: "Bereich fuer Leistungsbausteine, Pakete und Vergleichslogik.",
      title: "Leistungen",
      description: "Bereich fuer Leistungsbausteine, Pakete und Vergleichslogik.",
      sectionHeading: "Leistungsmodelle fuer verschiedene Wachstumsphasen",
    },
    vorlagen: {
      metaTitle: "Vorlagen | invessiv",
      metaDescription:
        "Bereich fuer verkaufbare Roadmaps, AGENTS.md-Pakete und Template-Previews.",
      title: "Vorlagen",
      description:
        "Bereich fuer verkaufbare Roadmaps, AGENTS.md-Pakete und Template-Previews.",
      sectionHeading: "Sofort einsetzbare Template-Produkte",
    },
    kontakt: {
      metaTitle: "Kontakt | invessiv",
      metaDescription:
        "Direkter Kontakt-Flow mit Terminbuchung und Anfrageformular.",
      title: "Kontakt",
      description:
        "Hier folgt der direkte Kontakt-Flow mit Terminbuchung und Anfrageformular.",
      optionsHeading: "Direkter Erstkontakt ohne Reibung",
      optionsDescription:
        "Fuer schnelle Abstimmung: Erstgespraech buchen oder direkt schriftlich anfragen. Beide Wege fuehren in denselben Projekt-Backlog.",
      emailLabel: "kontakt@invessiv.de",
      form: {
        title: "Projekt anfragen",
        description:
          "Mock-Flow: Das Formular validiert Eingaben und zeigt Status, ohne Versand.",
        nameLabel: "Name",
        emailLabel: "E-Mail",
        messageLabel: "Anfrage",
        submitLabel: "Anfrage senden",
        successMessage:
          "Danke, Anfrage validiert. Versand-Integration folgt.",
        errors: {
          requiredName: "Bitte Namen eingeben.",
          requiredEmail: "Bitte E-Mail eingeben.",
          invalidEmail: "Bitte eine gueltige E-Mail eingeben.",
          requiredMessage: "Bitte kurze Projektanfrage eingeben.",
        },
      },
    },
    impressum: {
      metaTitle: "Impressum | invessiv",
      metaDescription: "Platzhalter fuer rechtliche Angaben.",
      title: "Impressum",
      description: "Platzhalter fuer rechtliche Angaben.",
    },
    datenschutz: {
      metaTitle: "Datenschutz | invessiv",
      metaDescription: "Platzhalter fuer Datenschutzerklaerung.",
      title: "Datenschutz",
      description: "Platzhalter fuer Datenschutzerklaerung.",
    },
  },
  offers: {
    servicePackages: [
      {
        name: "Launch Sprint",
        priceFrom: "ab 1.490 EUR",
        summary:
          "Landing-Strategie, Copy-Grundgeruest und conversionstarkes UI in kurzer Iteration.",
        bullets: [
          "Positionierung + Seitenstruktur",
          "Responsive UI-Umsetzung",
          "CTA- und Tracking-Basis",
        ],
      },
      {
        name: "Growth System",
        priceFrom: "ab 2.900 EUR",
        summary:
          "Skalierbare Website-Architektur mit modularen Sektionen und klaren Release-Gates.",
        bullets: [
          "Modulare Komponentenarchitektur",
          "Content- und SEO-Layer",
          "Test- und CI-Setup",
        ],
      },
      {
        name: "Authority Platform",
        priceFrom: "ab 4.900 EUR",
        summary:
          "Premium-Auftritt mit starker Markenhandschrift, Trust-Assets und klarer Pipeline.",
        bullets: [
          "Individuelle Designrichtung",
          "Trust-/Proof-Integration",
          "Technische Skalierungsbasis",
        ],
      },
    ],
    templateProducts: [
      {
        title: "Handwerk Premium Onepager",
        price: "149 EUR",
        format: "Next.js + Tailwind",
      },
      {
        title: "Coach Conversion Template",
        price: "129 EUR",
        format: "Next.js + Tailwind",
      },
      {
        title: "Service Funnel Starterkit",
        price: "179 EUR",
        format: "Next.js + Tailwind",
      },
    ],
  },
};
