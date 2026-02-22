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
  actions: {
    menu: "Menue",
    login: "Login",
    call: "Call via Calendly",
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
      marqueeItems: [
        "Schneller Erstentwurf",
        "Klare CTA-Hierarchie",
        "Performance-Fokus",
        "Mockup-Upgrade Ready",
        "Mobile-first Delivery",
      ],
      kpis: [
        { value: "5", suffix: "Tage", label: "Time-to-first-draft" },
        { value: "92", suffix: "%", label: "Briefing-Aufwand reduziert" },
        { value: "1", suffix: "Owner", label: "Klarer Delivery-Owner" },
      ],
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
      flowHint:
        "Klicke auf einen Schritt, um Scope, Arbeitsmodus und Output zu sehen.",
      flowSteps: [
        {
          title: "Scope und Zielbild festlegen",
          detail:
            "Geschaeftsziel, Zielgruppe und Metriken werden vor Start klar fixiert.",
          output: "Output: Briefing-Canvas + Priorisierte Ziele",
        },
        {
          title: "Design- und Content-System definieren",
          detail:
            "Visuelle Leitidee, Copy-Struktur und Seitenrhythmus werden als System ausgearbeitet.",
          output: "Output: UI-Konzept + Inhaltsstruktur",
        },
        {
          title: "Feature-orientiert implementieren",
          detail:
            "Komponenten und Logik werden in kleinen, testbaren Modulen geliefert.",
          output: "Output: Reviewbare Inkremente mit klarer Verantwortung",
        },
        {
          title: "Tests, Review und kontrollierter Release",
          detail:
            "Jeder Kernpfad wird validiert, dann folgt der kontrollierte Rollout.",
          output: "Output: Release-Kandidat mit Rollback-Pfad",
        },
      ],
      casesHeading: "Mini-Cases",
      casesHint:
        "Kurze Problem -> Massnahme -> Ergebnis Darstellung statt austauschbarer Portfolio-Wand.",
      caseLabels: {
        problem: "Problem",
        action: "Massnahme",
        result: "Ergebnis",
      },
      cases: [
        {
          title: "Case: Lead-Page Upgrade",
          problem: "Hohe Absprungrate auf der Einstiegsseite.",
          action:
            "Hero-Message geschaerft, CTA-Hierarchie neu strukturiert, Above-the-fold entschlackt.",
          result: "Stabilere Conversion-Tendenz bei klarerer Nutzerfuehrung.",
          metrics: ["-28% Bounce (Platzhalter)", "+19% Leads (Platzhalter)"],
        },
        {
          title: "Case: Service-Website Relaunch",
          problem: "Unklarer Nutzen im Erstkontakt und zu viele Ablenkungen.",
          action:
            "Angebotsmodule fokussiert, Kontaktflow reduziert, Navigation priorisiert.",
          result: "Kuerzere Time-to-First-Call und bessere Qualitaet der Anfragen.",
          metrics: [
            "-35% Time-to-First-Call (Platzhalter)",
            "+22% Anfragequote (Platzhalter)",
          ],
        },
        {
          title: "Case: Interner Prozess-Flow",
          problem: "Manuelle Routineaufgaben mit hoher Fehleranfaelligkeit.",
          action:
            "Gefuehrten Prozess in ein kleines internes Tool ueberfuehrt.",
          result: "Spuerbare Zeitersparnis und stabilerer Ablauf im Tagesgeschaeft.",
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
      portalContactHeading: "Kontakt",
      portalContactHint: "Schnellster Weg: Calendly oder kurze Nachricht.",
      portalGoalPlaceholder: "Projektziel",
      portalAudiencePlaceholder: "Zielgruppe",
      portalDeadlinePlaceholder: "Gewuenschter Go-live Termin",
      portalMessagePlaceholder: "Kurze Projektbeschreibung",
      portalMockNote: "Mockup: Login folgt spaeter mit sicherem Backend.",
    },
    leistungen: {
      metaTitle: "Leistungen | invessiv",
      metaDescription: "Bereich fuer Leistungsbausteine, Pakete und Vergleichslogik.",
      badge: "Service-Fokus",
      title: "Leistungen",
      description: "Bereich fuer Leistungsbausteine, Pakete und Vergleichslogik.",
      hint: "Klare Angebotsmodule mit reduziertem Aufwand in der Abstimmung.",
      sectionHeading: "Leistungsmodelle fuer verschiedene Wachstumsphasen",
    },
    vorlagen: {
      metaTitle: "Vorlagen | invessiv",
      metaDescription:
        "Bereich fuer verkaufbare Roadmaps, AGENTS.md-Pakete und Template-Previews.",
      badge: "Template-Produkte",
      title: "Vorlagen",
      description:
        "Bereich fuer verkaufbare Roadmaps, AGENTS.md-Pakete und Template-Previews.",
      hint: "Sofort nutzbare Assets mit klarer Preis- und Leistungslogik.",
      sectionHeading: "Sofort einsetzbare Template-Produkte",
    },
    kontakt: {
      metaTitle: "Kontakt | invessiv",
      metaDescription:
        "Direkter Kontakt-Flow mit Terminbuchung und Anfrageformular.",
      badge: "Direkter Draht",
      title: "Kontakt",
      description:
        "Hier folgt der direkte Kontakt-Flow mit Terminbuchung und Anfrageformular.",
      hint: "Erstgespraech oder kurze Anfrage - beide Wege sind direkt verfuegbar.",
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
