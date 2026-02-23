import type { SectionId } from "@/config/site";
import type { Locale } from "@/config/i18n";

export type LandingSectionCopy = {
  title: string;
  description: string;
  metrics?: Array<{ label: string; value: string }>;
  cards?: Array<{ title: string; description: string; tag: string }>;
  serviceCards?: Array<{
    icon?: string;
    iconSrc?: string;
    iconAlt?: string;
    title: string;
    description: string;
    tag: string;
    bullets?: string[];
    chips?: string[];
    span?: 4 | 5 | 6 | 7;
    visualVariant?: "landing" | "upgrade" | "ai";
    visual?: boolean;
  }>;
  processSteps?: Array<{
    step: string;
    title: string;
    deliverable?: string;
    effort?: string;
    result?: string;
    description: string;
  }>;
  processSummary?: string;
  processRoles?: Array<{
    label: string;
    items: string[];
  }>;
  processCta?: {
    label: string;
    hint: string;
    href: string;
  };
  packageCards?: Array<{
    name: string;
    badge?: string;
    idealFor: string;
    price: string;
    timeline: string;
    scope: string[];
    ctaLabel: string;
    ctaHref: string;
    featured?: boolean;
  }>;
  packageSummary?: string;
  packageAssurances?: string[];
  packageSectionCta?: {
    label: string;
    hint: string;
    href: string;
  };
  packageDisclaimer?: string;
  contactChannels?: Array<{
    label: string;
    value: string;
    href: string;
    hint?: string;
    actionLabel?: string;
    copyValue?: string;
    copyLabel?: string;
    copiedLabel?: string;
  }>;
  contactChecklist?: string[];
  contactChecklistTitle?: string;
  contactChecklistHint?: string;
  contactCta?: {
    label: string;
    href: string;
    hint: string;
  };
  contactSecondaryCta?: {
    label: string;
    href: string;
    hint: string;
  };
  footerColumns?: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }>;
  footerHeroTitle?: string;
  footerHeroDescription?: string;
  footerHeroPrimaryCta?: { label: string; href: string };
  footerHeroSecondaryCta?: { label: string; href: string };
  footerNewsletter?: {
    title: string;
    description: string;
    inputPlaceholder: string;
    buttonLabel: string;
    consentLabel: string;
  };
  footerBrand?: string;
  footerCopyright?: string;
  footerSocialLinks?: Array<{
    platform: "linkedin" | "x" | "instagram";
    href: string;
    label: string;
  }>;
  footerLegalLinks?: Array<{ label: string; href: string }>;
  footerBottomNote?: string;
};

export type LandingSection = {
  id: SectionId;
  copy: Record<Locale, LandingSectionCopy>;
};

export type HomeSectionContent = {
  id: SectionId;
} & LandingSectionCopy;

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
          "Messbare Ergebnisse und klare Delivery-Signale statt Bauchgefuehl.",
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
        description:
          "Measurable outcomes and clear delivery signals instead of guesswork.",
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
        title: "Unsere Leistungen",
        description:
          "Schlanker Start mit fuenf klaren Angebotsbereichen im gleichen Delivery-Rhythmus.",
        serviceCards: [
          {
            iconSrc: "/services/01_landingpages.png",
            iconAlt: "Landingpages Icon",
            title: "Landingpages",
            description:
              "Conversion-optimierte One-Pager mit klarer Botschaft und starker Performance.",
            tag: "Beispiel folgt",
            visual: true,
            visualVariant: "landing",
            span: 4,
          },
          {
            iconSrc: "/services/02_websites.png",
            iconAlt: "Webseiten Icon",
            title: "Webseiten",
            description:
              "Individuelle Firmenwebseiten mit moderner Struktur und klarer Navigation.",
            tag: "Beispiel folgt",
            chips: ["SEO-ready", "Mobile-first", "Schnell"],
            span: 4,
          },
          {
            iconSrc: "/services/03_tools.png",
            iconAlt: "Prozess-Tools Icon",
            title: "Prozess-Tools",
            description:
              "Automatisierung interner Ablaeufe und effiziente Mini-Tools.",
            tag: "Beispiel folgt",
            bullets: [
              "Mini-Portale",
              "Workflow-Automation",
              "Status-Transparenz",
            ],
            span: 4,
          },
          {
            iconSrc: "/services/04_website_upgrade.png",
            iconAlt: "Website-Upgrade Icon",
            title: "Alte Website upgraden",
            description: "Bestehende Webseiten modernisieren und optimieren.",
            tag: "Beispiel folgt",
            visual: true,
            visualVariant: "upgrade",
            span: 6,
          },
          {
            iconSrc: "/services/05_ai_tempaltes.png",
            iconAlt: "KI-Templates Icon",
            title: "KI-Templates",
            description:
              "Vorgefertigte AI-Templates fuer Content-Erstellung und Marketing.",
            tag: "Beispiel folgt",
            bullets: ["Texte & Bilder", "Landingpages", "Social Media Posts"],
            visual: true,
            visualVariant: "ai",
            span: 6,
          },
        ],
      },
      en: {
        title: "Our Services",
        description:
          "A focused start with five clear offer areas in the same delivery rhythm.",
        serviceCards: [
          {
            iconSrc: "/services/01_landingpages.png",
            iconAlt: "Landing pages icon",
            title: "Landing pages",
            description:
              "Conversion-optimized one-pagers with clear messaging and strong performance.",
            tag: "Example coming soon",
            visual: true,
            visualVariant: "landing",
            span: 4,
          },
          {
            iconSrc: "/services/02_websites.png",
            iconAlt: "Websites icon",
            title: "Websites",
            description:
              "Custom company websites with modern structure and clean navigation.",
            tag: "Example coming soon",
            chips: ["SEO-ready", "Mobile-first", "Fast"],
            span: 4,
          },
          {
            iconSrc: "/services/03_tools.png",
            iconAlt: "Process tools icon",
            title: "Process tools",
            description:
              "Automation of internal workflows and efficient mini tools.",
            tag: "Example coming soon",
            bullets: [
              "Mini portals",
              "Workflow automation",
              "Status visibility",
            ],
            span: 4,
          },
          {
            iconSrc: "/services/04_website_upgrade.png",
            iconAlt: "Website upgrade icon",
            title: "Upgrade existing website",
            description: "Modernize and optimize your existing websites.",
            tag: "Example coming soon",
            visual: true,
            visualVariant: "upgrade",
            span: 6,
          },
          {
            iconSrc: "/services/05_ai_tempaltes.png",
            iconAlt: "AI templates icon",
            title: "AI templates",
            description:
              "Prebuilt AI templates for content creation and marketing.",
            tag: "Example coming soon",
            bullets: ["Texts & images", "Landing pages", "Social media posts"],
            visual: true,
            visualVariant: "ai",
            span: 6,
          },
        ],
      },
    },
  },
  {
    id: "process",
    copy: {
      de: {
        title: "In 4 Schritten zum fertigen Ergebnis",
        description:
          "Ob Landingpage, komplette Website, Upgrade oder Tool/Template: Du gibst Ziel und Angebot vor, wir liefern Draft, Feinschliff und Launch.",
        processSummary:
          "Typisch: erste Version in 48h (je nach Scope) | 1-2 Feedbackrunden | Go-live oder Uebergabe inklusive QA",
        processRoles: [
          {
            label: "Du lieferst",
            items: ["Ziel", "Angebot", "Assets"],
          },
          {
            label: "Wir liefern",
            items: [
              "Struktur + Copy/Design",
              "Setup + QA",
              "Launch + Uebergabe-Doku",
            ],
          },
        ],
        processSteps: [
          {
            step: "01",
            title: "Briefing & Input",
            deliverable: "30-min Briefing",
            effort: "Aufwand: 30 Min",
            result: "Ergebnis: Klarer Scope + Prioritaeten",
            description:
              "Du teilst Ziel, Angebot und Material. Wir setzen sofort die klare Umsetzungsbasis auf.",
          },
          {
            step: "02",
            title: "Draft",
            deliverable: "Klickbarer Draft oder Prototyp",
            effort: "Lieferzeit: meist 48h",
            result: "Ergebnis: Struktur + Kernlogik",
            description:
              "Du bekommst eine erste Version mit klarer Struktur, Inhalt und - falls noetig - funktionalem Prototyp.",
          },
          {
            step: "03",
            title: "Feinschliff",
            deliverable: "Conversion-Finish",
            effort: "Feedback: 1-2 Runden",
            result: "Ergebnis: Finales Design + Funktionen",
            description:
              "Design, Copy, UX-Details und relevante Funktionen werden gezielt finalisiert.",
          },
          {
            step: "04",
            title: "Go-live",
            deliverable: "Launch + Uebergabe",
            effort: "QA: finaler Check",
            result: "Ergebnis: Livegang oder Integrations-Uebergabe",
            description:
              "Nach QA geht das Projekt live oder wird sauber in deine Systeme uebergeben.",
          },
        ],
        processCta: {
          label: "Kostenlosen Kickoff Call buchen",
          hint: "Unverbindlich. Antwort in 24h.",
          href: "#contact",
        },
      },
      en: {
        title: "A finished result in 4 clear steps",
        description:
          "For landing pages, full websites, upgrades, or tools/templates: you share goal and offer, we deliver draft, refinement, and launch.",
        processSummary:
          "Typical: first version in 48h (depending on scope) | 1-2 feedback rounds | go-live or handover including QA",
        processRoles: [
          {
            label: "You provide",
            items: ["Goal", "Offer", "Assets"],
          },
          {
            label: "We deliver",
            items: [
              "Structure + copy/design",
              "Setup + QA",
              "Launch + handover docs",
            ],
          },
        ],
        processSteps: [
          {
            step: "01",
            title: "Briefing & Input",
            deliverable: "30-min briefing",
            effort: "Effort: 30 min",
            result: "Outcome: clear scope + priorities",
            description:
              "You share goals, offer, and materials. We set up a clear delivery foundation right away.",
          },
          {
            step: "02",
            title: "Draft",
            deliverable: "Clickable draft or prototype",
            effort: "Delivery: usually 48h",
            result: "Outcome: structure + core logic",
            description:
              "You get an initial version with clear structure, content, and functional prototype where needed.",
          },
          {
            step: "03",
            title: "Refinement",
            deliverable: "Conversion finish",
            effort: "Feedback: 1-2 rounds",
            result: "Outcome: final design + functions",
            description:
              "Design, copy, UX details, and relevant functions are finalized into the launch version.",
          },
          {
            step: "04",
            title: "Go live",
            deliverable: "Launch + handover",
            effort: "QA: final check",
            result: "Outcome: go-live or integration handover",
            description:
              "After QA, the project goes live or is handed over cleanly for integration in your setup.",
          },
        ],
        processCta: {
          label: "Book a free kickoff call",
          hint: "No commitment. Reply within 24h.",
          href: "#contact",
        },
      },
    },
  },
  {
    id: "pricing",
    copy: {
      de: {
        title: "Leistungen & Preise",
        description:
          "Konkrete Preise pro Leistung statt unklarer Paketlogik. So siehst du sofort, was du in welcher Zeit bekommst.",
        packageSummary:
          "Typisch: Start in 3â€“5 Werktagen, klare Scope-Empfehlung vor Umsetzung und feste RÃ¼ckmeldung innerhalb von 24h.",
        packageAssurances: [
          "1â€“2 Feedbackrunden inklusive",
          "Updates per E-Mail oder Call",
          "Klare Ãœbergabe mit QA",
        ],
        packageCards: [
          {
            name: "Landingpage",
            badge: "Conversion-Fokus",
            idealFor: "Ideal fÃ¼r Kampagnen, Angebote und schnelle Lead-Generierung",
            price: "ab 1.900 EUR",
            timeline: "Typisch live in 5-7 Werktagen",
            scope: [
              "Konzept, Struktur und klare Botschaft",
              "Copy/Design-Finish fÃ¼r eine Kernseite",
              "QA + Livegang oder saubere Ãœbergabe",
            ],
            ctaLabel: "Landingpage anfragen",
            ctaHref: "#contact",
          },
          {
            name: "Komplette Website",
            badge: "Meist gewÃ¤hlt",
            idealFor: "Ideal fÃ¼r Firmenauftritte oder Relaunches mit mehreren Seiten",
            price: "ab 4.900 EUR",
            timeline: "Typisch live in 10-15 Werktagen",
            scope: [
              "Mehrseitige Struktur mit klarer Journey",
              "Design + Content-Integration fÃ¼r zentrale Seiten",
              "Tracking-Basics, QA und Launch-Begleitung",
            ],
            ctaLabel: "Website anfragen",
            ctaHref: "#contact",
            featured: true,
          },
          {
            name: "Website-Upgrade",
            badge: "Bestehendes Setup nutzen",
            idealFor: "Ideal, wenn die Seite schon steht, aber Design/UX/Performance nicht mehr passt",
            price: "ab 2.400 EUR",
            timeline: "Typisch live in 5-10 Werktagen",
            scope: [
              "Analyse der bestehenden Seite",
              "Gezielte Verbesserungen statt kompletter Neubau",
              "QA, technische Stabilisierung und Ãœbergabe",
            ],
            ctaLabel: "Upgrade anfragen",
            ctaHref: "#contact",
          },
          {
            name: "Tools",
            badge: "Interne Prozesse beschleunigen",
            idealFor: "Ideal fÃ¼r interne Workflows, Mini-Tools und wiederkehrende Aufgaben",
            price: "ab 2.900 EUR",
            timeline: "Typisch live in 7-14 Werktagen",
            scope: [
              "Anforderungs- und Flow-Definition",
              "Umsetzung eines fokussierten Tools oder Mini-Portals",
              "QA, EinfÃ¼hrung und saubere Ãœbergabe",
            ],
            ctaLabel: "Tools anfragen",
            ctaHref: "#contact",
          },
          {
            name: "AI-Templates",
            badge: "Schneller Content-Output",
            idealFor: "Ideal fÃ¼r standardisierte Content-Produktion und Marketing-Workflows",
            price: "ab 1.400 EUR",
            timeline: "Typisch live in 3-6 Werktagen",
            scope: [
              "Template-Set fÃ¼r wiederkehrende Use-Cases",
              "Prompts, Struktur und Output-QualitÃ¤tsregeln",
              "Onboarding und Team-Handover",
            ],
            ctaLabel: "AI-Templates anfragen",
            ctaHref: "#contact",
          },
          {
            name: "Wartung",
            badge: "Bestehendes Projekt betreuen",
            idealFor: "Ideal, wenn du laufend Anpassungen, Fixes und neue Features brauchst",
            price: "ab 1.200 EUR / Monat",
            timeline: "Start meist innerhalb von 3-5 Werktagen",
            scope: [
              "Fester Backlog fÃ¼r Ã„nderungen und Verbesserungen",
              "Technische Wartung, Updates und Quality Checks",
              "Optional: neue Seiten, Tools oder Templates aus einem Flow",
            ],
            ctaLabel: "Wartung anfragen",
            ctaHref: "#contact",
          },
        ],
        packageDisclaimer:
          "Finale Preise richten sich nach Umfang, Integrationen und vorhandenem Ausgangsmaterial.",
        packageSectionCta: {
          label: "Scope anfragen",
          hint: "Unverbindlich. Antwort in 24h. Festpreis nach Scope.",
          href: "#contact",
        },
      },
      en: {
        title: "Services & Pricing",
        description:
          "Concrete pricing per service instead of vague package logic. You can quickly assess effort, timeline, and outcome.",
        packageSummary:
          "Typical: kickoff in 3-5 business days, clear scope recommendation before build, and first reply within 24h.",
        packageAssurances: [
          "1-2 feedback rounds included",
          "Updates via email or call",
          "Clear handover including QA",
        ],
        packageCards: [
          {
            name: "Landing page",
            badge: "Conversion focus",
            idealFor: "Best for campaigns, offers, and fast lead generation",
            price: "from EUR 1,900",
            timeline: "Typically live in 5-7 business days",
            scope: [
              "Concept, structure, and clear messaging",
              "Copy/design finish for one core page",
              "QA + go-live or clean handover",
            ],
            ctaLabel: "Request landing page",
            ctaHref: "#contact",
          },
          {
            name: "Full website",
            badge: "Most selected",
            idealFor: "Best for company websites or larger relaunches",
            price: "from EUR 4,900",
            timeline: "Typically live in 10-15 business days",
            scope: [
              "Multi-page structure with a clear journey",
              "Design + content integration for key pages",
              "Tracking basics, QA, and launch support",
            ],
            ctaLabel: "Request website",
            ctaHref: "#contact",
            featured: true,
          },
          {
            name: "Website upgrade",
            badge: "Use existing setup",
            idealFor: "Best when a site already exists but design/UX/performance needs work",
            price: "from EUR 2,400",
            timeline: "Typically live in 5-10 business days",
            scope: [
              "Audit of the current setup",
              "Targeted improvements instead of a full rebuild",
              "QA, technical stabilization, and handover",
            ],
            ctaLabel: "Request upgrade",
            ctaHref: "#contact",
          },
          {
            name: "Tools",
            badge: "Accelerate internal workflows",
            idealFor: "Best for internal workflows, mini tools, and recurring tasks",
            price: "from EUR 2,900",
            timeline: "Typically live in 7-14 business days",
            scope: [
              "Requirements and flow definition",
              "Build a focused tool or mini portal",
              "QA, rollout, and clean handover",
            ],
            ctaLabel: "Request tools",
            ctaHref: "#contact",
          },
          {
            name: "AI templates",
            badge: "Faster content output",
            idealFor: "Best for standardized content production and marketing workflows",
            price: "from EUR 1,400",
            timeline: "Typically live in 3-6 business days",
            scope: [
              "Template set for recurring use cases",
              "Prompts, structure, and output quality rules",
              "Onboarding and team handover",
            ],
            ctaLabel: "Request AI templates",
            ctaHref: "#contact",
          },
          {
            name: "Maintenance",
            badge: "Support existing project",
            idealFor: "Best when you need continuous fixes, updates, and new features",
            price: "from EUR 1,200 / month",
            timeline: "Usually starts within 3-5 business days",
            scope: [
              "Prioritized backlog for changes and improvements",
              "Technical maintenance, updates, and quality checks",
              "Optional new pages, tools, or templates in one flow",
            ],
            ctaLabel: "Request maintenance",
            ctaHref: "#contact",
          },
        ],
        packageDisclaimer:
          "Final pricing depends on scope, integrations, and existing project assets.",
        packageSectionCta: {
          label: "Request scope",
          hint: "No commitment. Reply in 24h. Fixed quote after scope.",
          href: "#contact",
        },
      },
    },
  },
  {
    id: "contact",
    copy: {
      de: {
        title: "Bereit fuer eine neue, produktive Website?",
        description:
          "Kontaktiere uns und starte dein Projekt mit Invessiv.",
        footerHeroTitle: "Bereit fÃ¼r eine neue, produktive Website?",
        footerHeroDescription:
          "Kontaktiere uns und starte dein Projekt mit Invessiv.",
        footerHeroPrimaryCta: { label: "Jetzt Projekt anfragen", href: "#contact" },
        footerHeroSecondaryCta: { label: "Leistungen ansehen", href: "#services" },
        footerColumns: [
          {
            title: "MenÃ¼",
            links: [
              { label: "Ergebnisse", href: "#proof" },
              { label: "Leistungen", href: "#services" },
              { label: "Pakete", href: "#pricing" },
              { label: "Kontakt", href: "#contact" },
            ],
          },
          {
            title: "Leistungen",
            links: [
              { label: "Landingpages", href: "#pricing" },
              { label: "Webdesign", href: "#pricing" },
              { label: "Webentwicklung", href: "#pricing" },
              { label: "Prozess-Tools", href: "#pricing" },
            ],
          },
          {
            title: "Kontakt",
            links: [
              { label: "Invessiv", href: "#" },
              { label: "info@invessiv.de", href: "mailto:info@invessiv.de" },
              { label: "0170 / 12345678", href: "tel:+4917012345678" },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "Â© 2024 Invessiv. Alle Rechte vorbehalten.",
        footerSocialLinks: [
          { platform: "linkedin", href: "#", label: "LinkedIn" },
          { platform: "x", href: "#", label: "X" },
          { platform: "instagram", href: "#", label: "Instagram" },
        ],
        footerLegalLinks: [
          { label: "Impressum", href: "#" },
          { label: "Datenschutz", href: "#" },
          { label: "AGB", href: "#" },
        ],
        contactChannels: [
          {
            label: "E-Mail",
            value: "hi@invessiv.de",
            href: "mailto:hi@invessiv.de",
            hint: "Ideal fÃ¼r Scope, Deadline und vorhandene Assets.",
            actionLabel: "Per E-Mail anfragen",
            copyValue: "hi@invessiv.de",
            copyLabel: "E-Mail kopieren",
            copiedLabel: "Kopiert",
          },
          {
            label: "Kennenlern-Call",
            value: "30 Min. â†’ Scope + nÃ¤chster Schritt + grobe EinschÃ¤tzung",
            href: "#contact",
            hint: "Kein Sales-Druck. Keine Spam-Nachrichten.",
            actionLabel: "Jetzt Projekt anfragen",
          },
        ],
        contactChecklist: [
          "Was soll entstehen oder verbessert werden?",
          "Gibt es eine Deadline oder ein wichtiges Datum?",
          "Welche Inhalte/Assets sind schon vorhanden?",
        ],
        contactChecklistTitle: "In 3 kurzen Antworten starten",
        contactChecklistHint: "Dauert ca. 2 Minuten.",
        contactCta: {
          label: "Jetzt Projekt anfragen",
          href: "#contact",
          hint: "Unverbindlich. 2-3 kurze Fragen, dann melden wir uns in 24h mit dem nÃ¤chsten Schritt.",
        },
        contactSecondaryCta: {
          label: "Leistungen ansehen",
          href: "#services",
          hint: "",
        },
      },
      en: {
        title: "Ready for a new, productive website?",
        description:
          "Contact us and start your project with Invessiv.",
        footerHeroTitle: "Ready for a new, productive website?",
        footerHeroDescription: "Contact us and start your project with Invessiv.",
        footerHeroPrimaryCta: { label: "Start project now", href: "#contact" },
        footerHeroSecondaryCta: { label: "View services", href: "#services" },
        footerColumns: [
          {
            title: "Menu",
            links: [
              { label: "Proof", href: "#proof" },
              { label: "Services", href: "#services" },
              { label: "Pricing", href: "#pricing" },
              { label: "Contact", href: "#contact" },
            ],
          },
          {
            title: "Services",
            links: [
              { label: "Landing pages", href: "#pricing" },
              { label: "Web design", href: "#pricing" },
              { label: "Web development", href: "#pricing" },
              { label: "Process tools", href: "#pricing" },
            ],
          },
          {
            title: "Contact",
            links: [
              { label: "Invessiv", href: "#" },
              { label: "info@invessiv.de", href: "mailto:info@invessiv.de" },
              { label: "+49 170 12345678", href: "tel:+4917012345678" },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "Â© 2024 Invessiv. All rights reserved.",
        footerSocialLinks: [
          { platform: "linkedin", href: "#", label: "LinkedIn" },
          { platform: "x", href: "#", label: "X" },
          { platform: "instagram", href: "#", label: "Instagram" },
        ],
        footerLegalLinks: [
          { label: "Imprint", href: "#" },
          { label: "Privacy", href: "#" },
          { label: "Terms", href: "#" },
        ],
        contactChannels: [
          {
            label: "Email",
            value: "hi@invessiv.de",
            href: "mailto:hi@invessiv.de",
            hint: "Best for scope, assets, and detailed context",
            actionLabel: "Request by email",
            copyValue: "hi@invessiv.de",
            copyLabel: "Copy email",
            copiedLabel: "Copied",
          },
          {
            label: "Discovery call",
            value: "30 min â†’ scope + next step + rough estimate",
            href: "#contact",
            hint: "No sales pressure. No spam.",
            actionLabel: "Book free call",
          },
        ],
        contactChecklist: [
          "What should be built or improved?",
          "Do you have a deadline or launch date?",
          "Which assets/content are already available?",
        ],
        contactChecklistTitle: "Start in 3 short answers",
        contactChecklistHint: "Takes about 2 minutes.",
        contactCta: {
          label: "Start project now",
          href: "#contact",
          hint: "No commitment. Answer 2-3 short questions and we reply in 24h with a clear next step.",
        },
        contactSecondaryCta: {
          label: "View services",
          href: "#services",
          hint: "",
        },
      },
    },
  },
  {
    id: "footer",
    copy: {
      de: {
        title: "Footer",
        description: "Schnellzugriff auf die wichtigsten Bereiche und Kontaktwege.",
        footerHeroTitle: "Bereit fÃ¼r eine neue, produktive Website?",
        footerHeroDescription:
          "Kontaktiere uns und starte dein Projekt mit Invessiv.",
        footerHeroPrimaryCta: { label: "Jetzt Projekt anfragen", href: "#contact" },
        footerHeroSecondaryCta: { label: "Leistungen ansehen", href: "#services" },
        footerColumns: [
          {
            title: "MenÃ¼",
            links: [
              { label: "Ergebnisse", href: "#proof" },
              { label: "Leistungen", href: "#services" },
              { label: "Pakete", href: "#pricing" },
              { label: "Kontakt", href: "#contact" },
            ],
          },
          {
            title: "Leistungen",
            links: [
              { label: "Landingpages", href: "#pricing" },
              { label: "Webdesign", href: "#pricing" },
              { label: "Webentwicklung", href: "#pricing" },
              { label: "Prozess-Tools", href: "#pricing" },
            ],
          },
          {
            title: "Kontakt",
            links: [
              { label: "Invessiv", href: "#" },
              { label: "info@invessiv.de", href: "mailto:info@invessiv.de" },
              { label: "0170 / 12345678", href: "tel:+4917012345678" },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "Â© 2026 Invessiv. Alle Rechte vorbehalten.",
        footerSocialLinks: [
          { platform: "linkedin", href: "#", label: "LinkedIn" },
          { platform: "x", href: "#", label: "X" },
          { platform: "instagram", href: "#", label: "Instagram" },
        ],
        footerLegalLinks: [
          { label: "Impressum", href: "#" },
          { label: "Datenschutz", href: "#" },
          { label: "AGB", href: "#" },
        ],
        footerBottomNote: "",
      },
      en: {
        title: "Footer",
        description: "Quick access to core pages and contact options.",
        footerHeroTitle: "Ready for a new, productive website?",
        footerHeroDescription:
          "Contact us and start your project with Invessiv.",
        footerHeroPrimaryCta: { label: "Start project now", href: "#contact" },
        footerHeroSecondaryCta: { label: "View services", href: "#services" },
        footerColumns: [
          {
            title: "Menu",
            links: [
              { label: "Proof", href: "#proof" },
              { label: "Services", href: "#services" },
              { label: "Packages", href: "#pricing" },
              { label: "Contact", href: "#contact" },
            ],
          },
          {
            title: "Services",
            links: [
              { label: "Landing pages", href: "#pricing" },
              { label: "Web design", href: "#pricing" },
              { label: "Web development", href: "#pricing" },
              { label: "Process tools", href: "#pricing" },
            ],
          },
          {
            title: "Contact",
            links: [
              { label: "Invessiv", href: "#" },
              { label: "info@invessiv.de", href: "mailto:info@invessiv.de" },
              { label: "+49 170 12345678", href: "tel:+4917012345678" },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "Â© 2026 Invessiv. All rights reserved.",
        footerSocialLinks: [
          { platform: "linkedin", href: "#", label: "LinkedIn" },
          { platform: "x", href: "#", label: "X" },
          { platform: "instagram", href: "#", label: "Instagram" },
        ],
        footerLegalLinks: [
          { label: "Imprint", href: "#" },
          { label: "Privacy", href: "#" },
          { label: "Terms", href: "#" },
        ],
        footerBottomNote: "",
      },
    },
  },
];

export function getHomeSections(locale: Locale): HomeSectionContent[] {
  return HOME_SECTIONS.map((section) => ({
    id: section.id,
    ...section.copy[locale],
  }));
}

