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
      differenceHeading: "Warum das keine Standard-Template-Seite ist",
      differenceHint:
        "Der Fokus liegt auf schneller Lieferung, geringem Aufwand und messbaren Ergebnissen.",
      differenceItems: [
        {
          title: "Time-to-Launch SLA",
          description:
            "Erste klickbare Version in 5 Werktagen mit klarem Go-live Plan je Paket.",
        },
        {
          title: "Upgrade statt Neubau",
          description:
            "Bestehende Seiten werden gezielt modernisiert, ohne alles neu aufzusetzen.",
        },
        {
          title: "KPI-orientiert",
          description:
            "Vorab definierte Ziele wie Ladezeit, Leads oder Conversion statt nur Design-Output.",
        },
      ],
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
      casesHeading: "Mini-Cases",
      casesHint:
        "Kurze Problem -> Massnahme -> Ergebnis Darstellung statt austauschbarer Portfolio-Wand.",
      cases: [
        {
          title: "Case: Lead-Page Upgrade",
          description:
            "Problem: hohe Absprungrate. Massnahme: klare Hero-Message und CTA-Hierarchie. Ergebnis: bessere Conversion-Tendenz.",
          metrics: ["-28% Bounce (Platzhalter)", "+19% Leads (Platzhalter)"],
        },
        {
          title: "Case: Service-Website Relaunch",
          description:
            "Problem: unklarer Nutzen. Massnahme: fokussierte Angebotsstruktur und schneller Kontaktflow. Ergebnis: kuerzere Time-to-First-Call.",
          metrics: [
            "-35% Time-to-First-Call (Platzhalter)",
            "+22% Anfragequote (Platzhalter)",
          ],
        },
        {
          title: "Case: Interner Prozess-Flow",
          description:
            "Problem: manuelle Routineaufgaben. Massnahme: kleines Tool mit gefuehrtem Ablauf. Ergebnis: Zeitersparnis im Tagesgeschaeft.",
          metrics: [
            "-6h/Woche manuelle Arbeit (Platzhalter)",
            "-41% Fehlerquote (Platzhalter)",
          ],
        },
      ],
      pricingHeading: "Preise und Checkout",
      pricingHint:
        "Optisch bereits final. Checkout ist aktuell absichtlich als Mock eingebaut.",
      pricingPlans: [
        {
          title: "Starter Landing",
          price: "490 EUR",
          features: ["One-Pager + Kontakt", "Responsive Design", "Schneller Go-live"],
        },
        {
          title: "Business Website",
          price: "1.490 EUR",
          features: [
            "Mehrseitige Struktur",
            "SEO + Legal Basis",
            "Conversion-Fokus",
          ],
        },
        {
          title: "Process Tool",
          price: "2.900 EUR",
          features: [
            "Automatisierung von Tasks",
            "Klare ROI-Ziele",
            "Erweiterbar fuer Login",
          ],
        },
      ],
      pricingMockNote: "Mockup: Zahlung folgt spaeter.",
      pricingButton: "Jetzt buchen (bald)",
      portalHeading: "Client Login",
      portalHint: "UI ist sichtbar, Auth-Logik ist noch deaktiviert.",
      portalLoginButton: "Einloggen (bald)",
      portalRegisterButton: "Account erstellen (bald)",
      portalMockNote: "Mockup: Login folgt spaeter mit sicherem Backend.",
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
