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
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
    featured?: boolean;
  }>;
  packageRecommendedBadgeLabel?: string;
  qnaItems?: Array<{
    question: string;
    answer: string;
  }>;
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
        title: "Pakete, die schnell live gehen.",
        description:
          "Wähle das passende Paket und bringe dein Projekt zügig online.",
        packageRecommendedBadgeLabel: "Empfohlen",
        packageCards: [
          {
            name: "Start",
            idealFor: "Perfekt für Landingpages",
            price: "ab 99€ / Monat",
            timeline: "Launch in wenigen Tagen",
            scope: [
              "Moderne Landingpages",
              "Responsive Design",
              "Schnelle Umsetzung",
              "SEO-optimiert",
              "KI-Templates",
            ],
            ctaLabel: "Projekt anfragen",
            ctaHref: "#contact",
            secondaryCtaLabel: "Leistungen ansehen",
            secondaryCtaHref: "#services",
          },
          {
            name: "Business",
            idealFor: "Professionelle Webseiten",
            price: "ab 199€ / Monat",
            timeline: "Launch in 7-10 Tagen",
            scope: [
              "Individuelles Design",
              "CMS & Pflegeleicht",
              "Performance-Optimierung",
              "Alte Site updaten",
              "KI-Unterstützung",
            ],
            ctaLabel: "Projekt anfragen",
            ctaHref: "#contact",
            secondaryCtaLabel: "Leistungen ansehen",
            secondaryCtaHref: "#services",
            featured: true,
          },
          {
            name: "Prozess",
            idealFor: "Tools für Optimierung",
            price: "ab 299€ / Monat",
            timeline: "Effizienz steigern",
            scope: [
              "Prozess-Automationen",
              "Workflow-Tools",
              "Daten-Analysen",
              "KI-Integrationen",
              "Individuelle Lösungen",
            ],
            ctaLabel: "Projekt anfragen",
            ctaHref: "#contact",
            secondaryCtaLabel: "Leistungen ansehen",
            secondaryCtaHref: "#services",
          },
          {
            name: "Individuell",
            idealFor: "Maßgeschneiderte Lösungen",
            price: "Individuelles Angebot",
            timeline: "Antwort < 24h",
            scope: [
              "Komplexe Projekte",
              "Specialanforderungen",
              "Persönliche Beratung",
            ],
            ctaLabel: "Kontakt aufnehmen",
            ctaHref: "#contact",
          },
        ],
      },
      en: {
        title: "Packages that go live quickly.",
        description:
          "Choose the right package and ship your project fast.",
        packageRecommendedBadgeLabel: "Recommended",
        packageCards: [
          {
            name: "Start",
            idealFor: "Perfect for landing pages",
            price: "from €99 / month",
            timeline: "Launch in just a few days",
            scope: [
              "Modern landing pages",
              "Responsive design",
              "Fast execution",
              "SEO optimized",
              "AI templates",
            ],
            ctaLabel: "Request project",
            ctaHref: "#contact",
            secondaryCtaLabel: "View services",
            secondaryCtaHref: "#services",
          },
          {
            name: "Business",
            idealFor: "Professional websites",
            price: "from €199 / month",
            timeline: "Launch in 7-10 days",
            scope: [
              "Custom design",
              "CMS & easy maintenance",
              "Performance optimization",
              "Update existing site",
              "AI support",
            ],
            ctaLabel: "Request project",
            ctaHref: "#contact",
            secondaryCtaLabel: "View services",
            secondaryCtaHref: "#services",
            featured: true,
          },
          {
            name: "Process",
            idealFor: "Tools for optimization",
            price: "from €299 / month",
            timeline: "Increase efficiency",
            scope: [
              "Process automations",
              "Workflow tools",
              "Data analytics",
              "AI integrations",
              "Custom solutions",
            ],
            ctaLabel: "Request project",
            ctaHref: "#contact",
            secondaryCtaLabel: "View services",
            secondaryCtaHref: "#services",
          },
          {
            name: "Custom",
            idealFor: "Tailored solutions",
            price: "Custom quote",
            timeline: "Reply < 24h",
            scope: [
              "Complex projects",
              "Special requirements",
              "Personal consulting",
            ],
            ctaLabel: "Get in touch",
            ctaHref: "#contact",
          },
        ],
      },
    },
  },
  {
    id: "faq",
    copy: {
      de: {
        title: "Q&A",
        description: "Die wichtigsten Fragen zum Ablauf, transparent und direkt beantwortbar.",
        qnaItems: [
          {
            question: "Wie läuft der Projektstart ab?",
            answer:
              "Nach deiner Anfrage klären wir Ziel, Umfang und Deadline in einem kurzen Call oder per E-Mail. Danach bekommst du eine klare Scope-Empfehlung mit nächstem Schritt, Zeitplan und transparentem Angebot.",
          },
          {
            question: "Könnt ihr meine alte Website überarbeiten?",
            answer:
              "Ja. Wir können bestehende Seiten gezielt modernisieren, technisch stabilisieren und für Conversion verbessern, ohne alles neu zu bauen. Falls ein kompletter Relaunch sinnvoller ist, sagen wir das offen vorab.",
          },
          {
            question: "Welche Tools setzt ihr ein?",
            answer:
              "Wir arbeiten je nach Projekt mit Next.js, Tailwind, Figma und passenden Analyse- bzw. Workflow-Tools. Die Auswahl richtet sich nach deinem Setup, damit Übergabe und Wartung sauber funktionieren.",
          },
          {
            question: "Gibt es versteckte Kosten?",
            answer:
              "Nein. Du erhältst vor Start ein klares Angebot mit definiertem Scope. Zusätzliche Wünsche außerhalb des Scopes stimmen wir immer vor Umsetzung transparent mit dir ab.",
          },
        ],
      },
      en: {
        title: "Q&A",
        description: "The most relevant questions about process and collaboration, clear and direct.",
        qnaItems: [
          {
            question: "How does project kickoff work?",
            answer:
              "After your request, we align on goals, scope, and timeline in a short call or by email. You then get a clear scope recommendation with next steps, delivery timing, and transparent pricing.",
          },
          {
            question: "Can you redesign my existing website?",
            answer:
              "Yes. We can modernize existing pages, improve technical stability, and optimize for conversion without rebuilding everything from scratch. If a full relaunch is the better option, we tell you upfront.",
          },
          {
            question: "Which tools do you use?",
            answer:
              "Depending on the project, we work with Next.js, Tailwind, Figma, and suitable analytics or workflow tools. We choose the stack to fit your setup for a clean handover and maintainability.",
          },
          {
            question: "Are there any hidden costs?",
            answer:
              "No. You receive a clear offer with a defined scope before implementation starts. Any additional requests outside scope are always aligned transparently before execution.",
          },
        ],
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
        footerHeroTitle: "Bereit für eine neue, produktive Website?",
        footerHeroDescription:
          "Kontaktiere uns und starte dein Projekt mit Invessiv.",
        footerHeroPrimaryCta: { label: "Jetzt Projekt anfragen", href: "#contact" },
        footerHeroSecondaryCta: { label: "Leistungen ansehen", href: "#services" },
        footerColumns: [
          {
            title: "Menü",
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
        footerCopyright: "© 2024 Invessiv. Alle Rechte vorbehalten.",
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
            hint: "Ideal für Scope, Deadline und vorhandene Assets.",
            actionLabel: "Per E-Mail anfragen",
            copyValue: "hi@invessiv.de",
            copyLabel: "E-Mail kopieren",
            copiedLabel: "Kopiert",
          },
          {
            label: "Kennenlern-Call",
            value: "30 Min. → Scope + nächster Schritt + grobe Einschätzung",
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
          hint: "Unverbindlich. 2-3 kurze Fragen, dann melden wir uns in 24h mit dem nächsten Schritt.",
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
        footerCopyright: "© 2024 Invessiv. All rights reserved.",
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
            value: "30 min → scope + next step + rough estimate",
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
        footerHeroTitle: "Bereit für eine neue, produktive Website?",
        footerHeroDescription:
          "Kontaktiere uns und starte dein Projekt mit Invessiv.",
        footerHeroPrimaryCta: { label: "Jetzt Projekt anfragen", href: "#contact" },
        footerHeroSecondaryCta: { label: "Leistungen ansehen", href: "#services" },
        footerColumns: [
          {
            title: "Menü",
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
        footerCopyright: "© 2026 Invessiv. Alle Rechte vorbehalten.",
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
        footerCopyright: "© 2026 Invessiv. All rights reserved.",
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

