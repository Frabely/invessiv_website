import type { SectionId } from "@/config/site";
import type { Locale } from "@/config/i18n";
import {
  COMPANY,
  COMPANY_MAILTO,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
  COMPANY_SOCIAL_X,
  COMPANY_TEL,
} from "@/config/company";
export type LandingSectionCopy = {
  title: string;
  description: string;
  summaryPoints?: string[];
  metrics?: Array<{ label: string; value: string }>;
  cards?: Array<{ title: string; description: string; tag: string }>;
  serviceCards?: Array<{
    key: "ai" | "landing" | "process" | "web" | "upgrade" | "maintenance";
    iconSrc?: string;
    iconAlt?: string;
    title: string;
    description: string;
    price: string;
    delivery: string;
    deliveryLabel?: string;
    isRecommended?: boolean;
    included: string[];
    details?: string[];
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
  contactForm?: {
    title: string;
    subtitle: string;
    intro: string;
    conditionalFieldHint: string;
    firstNameLabel: string;
    lastNameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    companyLabel: string;
    roleLabel: string;
    websiteLabel: string;
    websiteRequiredHint: string;
    offerLabel: string;
    offerPlaceholder: string;
    goalLabel: string;
    goalOptions: string[];
    pagesLabel: string;
    pagesPlaceholder: string;
    workflowLabel: string;
    workflowOptions: string[];
    budgetLabel: string;
    budgetOptions: string[];
    startLabel: string;
    startOptions: string[];
    projectDetailsLabel: string;
    projectDetailsPlaceholder: string;
    consentLabel: string;
    privacyLabel: string;
    mailSubjectPrefix: string;
    mailBodyTitle: string;
    mailLabelName: string;
    mailLabelEmail: string;
    mailLabelPhone: string;
    mailLabelCompany: string;
    mailLabelRole: string;
    mailLabelWebsite: string;
    mailLabelOffer: string;
    mailLabelBudget: string;
    mailLabelStart: string;
    mailBodyDetailsLabel: string;
    submitLabel: string;
    submitSuccess: string;
    requiredHint: string;
    closeLabel: string;
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

const LEGAL_PAGE_HREFS = {
  de: {
    imprint: "/de/imprint",
    privacy: "/de/privacy",
    terms: "/de/terms",
  },
  en: {
    imprint: "/en/imprint",
    privacy: "/en/privacy",
    terms: "/en/terms",
  },
} as const;

const HOME_SECTIONS: LandingSection[] = [
  {
    id: "hero",
    copy: {
      de: {
        title:
          "Digitale Lösungen, die sichtbar wirken und Prozesse spürbar vereinfachen.",
        description:
          "Du gibst nur den nötigen Input, ich übernehme den Rest: Landingpages, Webseiten und Prozess-Tools mit schneller Umsetzung bis zum produktiven Ergebnis.",
      },
      en: {
        title:
          "Digital solutions that create visible impact and simplify processes.",
        description:
          "You provide the required input, I handle the rest: landing pages, websites, and process tools delivered quickly to production-ready quality.",
      },
    },
  },
  {
    id: "proof",
    copy: {
      de: {
        title: "Proof",
        description:
          "Messbare Ergebnisse und klare Delivery-Signale statt Bauchgef?hl.",
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
        title: "Leistungen & Preise",
        description:
          "Projektbasierte, einmalige Preise mit klarem Scope, transparenter Lieferzeit und direktem Weg zur Anfrage.",
        summaryPoints: [
          "Einmalpreise pro Projekt",
          "Scope vor Start definiert",
          "Lieferzeit im Angebot fix",
        ],
        serviceCards: [
          {
            key: "landing",
            iconSrc: "/services/website-layout-icon.svg",
            iconAlt: "Landing pages Icon",
            title: "Landing pages",
            description:
              "Conversion-optimierte One-Pager mit klarer Botschaft und starker Performance.",
            isRecommended: true,
            price: "ab 990 € einmalig",
            delivery: "3–7 Tage",
            included: [
              "Struktur & Wireframe (Hero, Benefits, CTA, FAQ)",
              "Responsive Design (Mobile-first)",
              "Basis-SEO (Meta, OG, Indexing-Ready)",
              "Performance-Optimierung (Core Web Vitals Fokus)",
              "Tracking-Setup (GA4/Pixel optional)",
              "1–2 Korrekturschleifen",
            ],
            details: [
              "Copy-Feinschliff und Inhaltsproduktion sind als Add-on möglich.",
              "Mehr als 2 Korrekturschleifen werden separat kalkuliert.",
              "Hosting, Domain und externe Tool-Lizenzen sind nicht enthalten.",
            ],
          },
          {
            key: "web",
            iconSrc: "/services/coding-icon.svg",
            iconAlt: "Webseiten Icon",
            title: "Webseiten",
            description:
              "Moderne Unternehmensseiten mit sauberer Navigation und einfacher Pflege.",
            price: "ab 2.490 € einmalig",
            delivery: "7–14 Tage",
            included: [
              "Individuelles Design-System (leicht erweiterbar)",
              "Seitenstruktur & Navigation (UX-fokussiert)",
              "CMS / einfache Wartbarkeit (je nach Stack)",
              "Performance & technische SEO Basics",
              "Kontakt/Lead-Flow + Formular",
              "Deployment/Go-Live Support",
            ],
            details: [
              "Mehrsprachigkeit und zusätzliche Seiten werden vorab klar gescopet.",
              "CMS-Setup erfolgt nur, wenn im gewählten Stack sinnvoll integriert.",
              "Drittanbieter-Lizenzen und externe Integrationen sind nicht im Grundpreis enthalten.",
            ],
          },
          {
            key: "process",
            iconSrc: "/services/process-icon.svg",
            iconAlt: "Prozess-Tools Icon",
            title: "Prozess-Tools",
            description:
              "Mini-Tools zur Automatisierung interner Abläufe und mehr Transparenz.",
            price: "ab 3.490 € einmalig",
            delivery: "10–21 Tage",
            included: [
              "Scope-Workshop light (Ziele, Daten, Rollen)",
              "MVP-Umsetzung (1 Kern-Workflow)",
              "Status/Dashboard-Ansicht (basic)",
              "Integrationen (nach Scope: Webhooks, APIs)",
              "Auth/Access (basic)",
              "Übergabe + kurze Doku/Einweisung",
            ],
            details: [
              "Weitere Workflows werden modular als Folgepaket geplant.",
              "Enterprise-Auth (z. B. SSO) ist nicht im Basis-MVP enthalten.",
              "Betrieb, Monitoring und Support werden separat angeboten.",
            ],
          },
          {
            key: "upgrade",
            iconSrc: "/services/slow-internet-speed-icon.svg",
            iconAlt: "Website-Upgrade Icon",
            title: "Upgrade bestehende Website",
            description:
              "Mehr Speed, bessere UX und modernes UI – ohne kompletten Neubau.",
            price: "ab 750 € einmalig",
            delivery: "3–10 Tage",
            included: [
              "Performance-Audit + Quick-Wins",
              "UX/UI Refresh (gezielte Verbesserungen)",
              "SEO-Technik Basics (Indexing, Struktur)",
              "Fixes für Responsiveness & Accessibility Basics",
              "Code/CSS Cleanup (wo sinnvoll)",
              "Messbare Vorher/Nachher Checks",
            ],
            details: [
              "Optional: Development/Implementation mit 70–85 € / h oder Content/kleine Pflege mit 50–60 € / h.",
              "Größere Rebuild-Themen werden transparent separat empfohlen.",
              "Tiefe Backend-Refactors sind nicht Teil des Basis-Upgrades.",
            ],
          },
          {
            key: "ai",
            iconSrc: "/services/ai-file-icon.svg",
            iconAlt: "KI-Templates Icon",
            title: "KI-Templates",
            description:
              "Vorlagen für Content & Marketing, abgestimmt auf deine Brand.",
            price: "ab 290 € einmalig",
            delivery: "2–5 Tage",
            included: [
              "Templates für Texte & Hooks",
              "Landingpage-Abschnitte (Hero, Benefits, FAQ)",
              "Social Post Sets (z. B. 10–20 Varianten)",
              "Brand-Tone Anpassung",
              "Beispiele + Mini-Guide zur Nutzung",
            ],
            details: [
              "Kein vollautomatischer Kanalbetrieb im Paket enthalten.",
              "Bild- oder Video-Produktion kann optional ergänzt werden.",
              "Zusätzliche Variantenpakete sind jederzeit nachbuchbar.",
            ],
          },
          {
            key: "maintenance",
            iconSrc: "/services/customer-service-icon.svg",
            iconAlt: "Wartung und Support Icon",
            title: "Wartung & Support",
            description:
              "Schnelle Änderungen, Bugfixes und Pflege – flexibel nach Bedarf.",
            price: "70–85 € / h",
            delivery: "24–72h",
            deliveryLabel: "Typische Reaktionszeit",
            included: [
              "Content/kleine Pflege: 50–60 € / h",
              "Development/Implementation: 70–85 € / h",
              "Monitoring/Checks (optional)",
              "Priorisierte Abarbeitung nach Impact",
              "Stundenpakete optional",
            ],
            details: [
              "Stundenpakete: 5h = 225 € oder 10h = 430 €.",
              "Abrechnung erfolgt transparent nach tatsächlichem Aufwand.",
              "Notfall-Requests werden nach Verfügbarkeit priorisiert.",
            ],
          },
        ],
      },
      en: {
        title: "Leistungen & Preise",
        description:
          "Project-based one-time pricing with transparent scope, clear delivery windows, and direct contact CTA.",
        summaryPoints: [
          "One-time pricing per project",
          "Scope defined before kickoff",
          "Delivery window fixed upfront",
        ],
        serviceCards: [
          {
            key: "landing",
            iconSrc: "/services/website-layout-icon.svg",
            iconAlt: "Landing pages icon",
            title: "Landing pages",
            description:
              "Conversion-optimized one-pagers with clear messaging and strong performance.",
            isRecommended: true,
            price: "from €990 one-time",
            delivery: "3–7 days",
            included: [
              "Structure & wireframe (hero, benefits, CTA, FAQ)",
              "Responsive design (mobile-first)",
              "Basic SEO setup (meta, OG, indexing-ready)",
              "Performance optimization (Core Web Vitals focus)",
              "Tracking setup (GA4/pixel optional)",
              "1–2 feedback rounds",
            ],
            details: [
              "Content production and copy refinement available as add-on.",
              "More than two feedback rounds are scoped separately.",
              "Hosting, domain, and external licenses are excluded.",
            ],
          },
          {
            key: "web",
            iconSrc: "/services/coding-icon.svg",
            iconAlt: "Websites icon",
            title: "Websites",
            description:
              "Modern company websites with clean navigation and easy maintenance.",
            price: "from €2,490 one-time",
            delivery: "7–14 days",
            included: [
              "Custom design system (easy to extend)",
              "Site architecture & UX-focused navigation",
              "CMS / simple maintainability (stack dependent)",
              "Performance and technical SEO basics",
              "Contact/lead flow + form",
              "Deployment/go-live support",
            ],
            details: [
              "Additional pages and multilingual scope are planned upfront.",
              "CMS setup is included only where the stack supports it cleanly.",
              "Third-party licenses and external integrations are excluded.",
            ],
          },
          {
            key: "process",
            iconSrc: "/services/process-icon.svg",
            iconAlt: "Process tools icon",
            title: "Process tools",
            description:
              "Mini tools that automate internal workflows and create transparency.",
            price: "from €3,490 one-time",
            delivery: "10–21 days",
            included: [
              "Light scope workshop (goals, data, roles)",
              "MVP implementation (1 core workflow)",
              "Basic status/dashboard view",
              "Integrations by scope (webhooks, APIs)",
              "Basic auth/access",
              "Handover + short documentation",
            ],
            details: [
              "Additional workflows are delivered as scoped follow-up modules.",
              "Enterprise auth (e.g. SSO) is not in the base MVP.",
              "Operations, monitoring, and support are available as add-ons.",
            ],
          },
          {
            key: "upgrade",
            iconSrc: "/services/slow-internet-speed-icon.svg",
            iconAlt: "Website upgrade icon",
            title: "Upgrade existing website",
            description:
              "More speed, better UX, and modern UI without a full rebuild.",
            price: "from €750 one-time",
            delivery: "3–10 days",
            included: [
              "Performance audit + quick wins",
              "UX/UI refresh (targeted improvements)",
              "SEO technical basics (indexing, structure)",
              "Responsiveness and accessibility basics",
              "Code/CSS cleanup where useful",
              "Measurable before/after checks",
            ],
            details: [
              "Optional hourly support: development/implementation at €70–85 / h or content/small updates at €50–60 / h.",
              "Larger rebuild topics are transparently scoped separately.",
              "Deep backend refactors are outside base upgrade scope.",
            ],
          },
          {
            key: "ai",
            iconSrc: "/services/ai-file-icon.svg",
            iconAlt: "AI templates icon",
            title: "AI templates",
            description:
              "Content and marketing templates aligned to your brand voice.",
            price: "from €290 one-time",
            delivery: "2–5 days",
            included: [
              "Templates for copy and hooks",
              "Landing page blocks (hero, benefits, FAQ)",
              "Social post sets (e.g. 10–20 variants)",
              "Brand tone alignment",
              "Examples + mini usage guide",
            ],
            details: [
              "No full channel automation is included.",
              "Image/video production can be added separately.",
              "Additional variant packs are available any time.",
            ],
          },
          {
            key: "maintenance",
            iconSrc: "/services/customer-service-icon.svg",
            iconAlt: "Maintenance and support icon",
            title: "Maintenance & support",
            description:
              "Fast edits, bugfixes, and upkeep with flexible hourly support.",
            price: "€70–85 / h",
            delivery: "24–72h",
            deliveryLabel: "Typical response time",
            included: [
              "Content/small updates: €50–60 / h",
              "Development/implementation: €70–85 / h",
              "Monitoring/checks (optional)",
              "Prioritized queue by business impact",
              "Optional hour bundles",
            ],
            details: [
              "Hour bundles: 5h = €225 or 10h = €430.",
              "Transparent billing based on effective work time.",
              "Urgent requests are prioritized by availability.",
            ],
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
          "Ob Landingpage, komplette Website, Upgrade oder Tool/Template: Du gibst Ziel und Angebot vor, ich liefere Draft, Feinschliff und Launch.",
        summaryPoints: [
          "Ziel + Angebot in 30 Minuten geklärt",
          "Erster Draft meist in 48h",
          "Go-live inkl. QA und Übergabe",
        ],
        processSummary:
          "Typisch: erste Version in 48h (je nach Scope) | 1-2 Feedbackrunden | Go-live oder Übergabe inklusive QA",
        processRoles: [
          {
            label: "Du lieferst",
            items: ["Ziel", "Angebot", "Assets"],
          },
          {
            label: "Ich liefere",
            items: [
              "Struktur + Copy/Design",
              "Setup + QA",
              "Launch + Übergabe-Doku",
            ],
          },
        ],
        processSteps: [
          {
            step: "01",
            title: "Briefing & Input",
            deliverable: "30-min Briefing",
            effort: "Aufwand: 30 Min",
            result: "Ergebnis: Klarer Scope + Priorit?ten",
            description:
              "Du teilst Ziel, Angebot und Material. Ich setze sofort die klare Umsetzungsbasis auf.",
          },
          {
            step: "02",
            title: "Draft",
            deliverable: "Klickbarer Draft oder Prototyp",
            effort: "Lieferzeit: meist 48h",
            result: "Ergebnis: Struktur + Kernlogik",
            description:
              "Du bekommst eine erste Version mit klarer Struktur, Inhalt und - falls nötig - funktionalem Prototyp.",
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
            deliverable: "Launch + Übergabe",
            effort: "QA: finaler Check",
            result: "Ergebnis: Livegang oder Integrations-Übergabe",
            description:
              "Nach QA geht das Projekt live oder wird sauber in deine Systeme übergeben.",
          },
        ],
        processCta: {
          label: "Projekt anfragen",
          hint: "Unverbindlich. Antwort in 24h.",
          href: "#contact",
        },
      },
      en: {
        title: "A finished result in 4 clear steps",
        description:
          "For landing pages, full websites, upgrades, or tools/templates: you share goal and offer, I deliver draft, refinement, and launch.",
        summaryPoints: [
          "Goal and offer aligned in 30 minutes",
          "First draft usually within 48h",
          "Go-live includes QA and handover",
        ],
        processSummary:
          "Typical: first version in 48h (depending on scope) | 1-2 feedback rounds | go-live or handover including QA",
        processRoles: [
          {
            label: "You provide",
            items: ["Goal", "Offer", "Assets"],
          },
          {
            label: "I deliver",
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
              "You share goals, offer, and materials. I set up a clear delivery foundation right away.",
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
          label: "Request project",
          hint: "No commitment. Reply within 24h.",
          href: "#contact",
        },
      },
    },
  },
  {
    id: "faq",
    copy: {
      de: {
        title: "Q&A",
        description:
          "Die wichtigsten Fragen zum Ablauf, transparent und direkt beantwortbar.",
        summaryPoints: [
          "Start, Scope und Timing klar",
          "Kosten und Grenzen transparent",
          "Tooling passend zu deinem Setup",
        ],
        qnaItems: [
          {
            question: "Wie läuft der Projektstart ab?",
            answer:
              "Nach deiner Anfrage kläre ich Ziel, Umfang und Deadline in einem kurzen Call oder per E-Mail. Danach bekommst du eine klare Scope-Empfehlung mit nächstem Schritt, Zeitplan und transparentem Angebot.",
          },
          {
            question: "Könnt ihr meine alte Website überarbeiten?",
            answer:
              "Ja. Ich kann bestehende Seiten gezielt modernisieren, technisch stabilisieren und für Conversion verbessern, ohne alles neu zu bauen. Falls ein kompletter Relaunch sinnvoller ist, sage ich das offen vorab.",
          },
          {
            question: "Welche Tools setzt ihr ein?",
            answer:
              "Ich arbeite je nach Projekt mit Next.js, Tailwind, Figma und passenden Analyse- bzw. Workflow-Tools. Die Auswahl richtet sich nach deinem Setup, damit Übergabe und Wartung sauber funktionieren.",
          },
          {
            question: "Gibt es versteckte Kosten?",
            answer:
              "Nein. Du erhältst vor Start ein klares Angebot mit definiertem Scope. Zusätzliche Wünsche außerhalb des Scopes stimme ich immer vor Umsetzung transparent mit dir ab.",
          },
        ],
      },
      en: {
        title: "Q&A",
        description:
          "The most relevant questions about process and collaboration, clear and direct.",
        summaryPoints: [
          "Kickoff, scope, and timing clarified",
          "Costs and boundaries made transparent",
          "Tooling matched to your setup",
        ],
        qnaItems: [
          {
            question: "How does project kickoff work?",
            answer:
              "After your request, I align on goals, scope, and timeline in a short call or by email. You then get a clear scope recommendation with next steps, delivery timing, and transparent pricing.",
          },
          {
            question: "Can you redesign my existing website?",
            answer:
              "Yes. I can modernize existing pages, improve technical stability, and optimize for conversion without rebuilding everything from scratch. If a full relaunch is the better option, I tell you upfront.",
          },
          {
            question: "Which tools do you use?",
            answer:
              "Depending on the project, I work with Next.js, Tailwind, Figma, and suitable analytics or workflow tools. I choose the stack to fit your setup for a clean handover and maintainability.",
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
        title: "Bereit für eine neue, produktive Website?",
        description: "Kontaktiere uns und starte dein Projekt mit Invessiv.",
        summaryPoints: [
          "Antwort in 24h",
          "2-3 Fragen",
          "Direkter Kontakt",
        ],
        footerHeroTitle: "Bereit für eine neue, produktive Website?",
        footerHeroDescription:
          "Kontaktiere uns und starte dein Projekt mit Invessiv.",
        footerHeroPrimaryCta: {
          label: "Jetzt Projekt anfragen",
          href: "#contact",
        },
        footerHeroSecondaryCta: {
          label: "Leistungen ansehen",
          href: "#services",
        },
        footerColumns: [
          {
            title: "Menü",
            links: [
              { label: "Ergebnisse", href: "#proof" },
              { label: "Leistungen & Preise", href: "#services" },
              { label: "Prozess", href: "#process" },
              { label: "FAQ", href: "#faq" },
              { label: "Kontakt", href: "#contact" },
            ],
          },
          {
            title: "Kontakt",
            links: [
              { label: "Invessiv", href: "/imprint#company-details" },
              { label: COMPANY.contact.email, href: COMPANY_MAILTO },
              { label: COMPANY.contact.phoneDisplayDe, href: COMPANY_TEL },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "© 2024 Moritz Hecht – Invessiv. Alle Rechte vorbehalten.",
        footerSocialLinks: [
          {
            platform: "linkedin",
            href: COMPANY_SOCIAL_LINKEDIN,
            label: "LinkedIn",
          },
          { platform: "x", href: COMPANY_SOCIAL_X, label: "X" },
          {
            platform: "instagram",
            href: COMPANY_SOCIAL_INSTAGRAM,
            label: "Instagram",
          },
        ],
        footerLegalLinks: [
          { label: "Impressum", href: "/imprint" },
          { label: "Datenschutz", href: "/privacy" },
          { label: "AGB", href: "/terms" },
        ],
        contactChannels: [
          {
            label: "E-Mail",
            value: COMPANY.contact.email,
            href: COMPANY_MAILTO,
            hint: "Ideal für Scope, Deadline und vorhandene Assets.",
            actionLabel: "Per E-Mail anfragen",
            copyValue: COMPANY.contact.email,
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
          hint: "Unverbindlich. 2-3 kurze Fragen, dann melde ich mich in 24h mit dem nächsten Schritt.",
        },
        contactSecondaryCta: {
          label: "Leistungen ansehen",
          href: "#services",
          hint: "",
        },
        contactForm: {
          title: "Projektanfrage in 2 Minuten",
          subtitle:
            "Kurzer Scope-Check, damit ich direkt den nächsten sinnvollen Schritt liefern kann.",
          intro:
            "Je konkreter die Angaben, desto schneller bekommst du eine klare Empfehlung zu Umfang, Timing und Budget.",
          conditionalFieldHint:
            "Je nach gewähltem Angebot blende ich gezielt relevante Pflichtfelder ein.",
          firstNameLabel: "Vorname",
          lastNameLabel: "Nachname",
          emailLabel: "Geschäftliche E-Mail",
          phoneLabel: "Telefon",
          companyLabel: "Unternehmen",
          roleLabel: "Rolle",
          websiteLabel: "Aktuelle Website",
          websiteRequiredHint:
            "Bei Website-Upgrade, Webseiten und Wartung ist die aktuelle Website erforderlich.",
          offerLabel: "Gewünschtes Angebot",
          offerPlaceholder: "Bitte Angebot auswählen",
          goalLabel: "Primäres Ziel für die Landingpage",
          goalOptions: [
            "Leads/Anfragen erhalten",
            "Terminbuchungen erhöhen",
            "Produkt verkaufen",
            "Newsletter-Anmeldungen",
          ],
          pagesLabel: "Benötigte Seiten",
          pagesPlaceholder:
            "z. B. Start, Leistungen, Über uns, Kontakt, Karriere",
          workflowLabel: "Anzahl Kern-Workflows",
          workflowOptions: ["1 Workflow", "2 Workflows", "3+ Workflows"],
          budgetLabel: "Budgetrahmen",
          budgetOptions: [
            "Unter 1.000 €",
            "1.000 € - 2.500 €",
            "2.500 € - 5.000 €",
            "5.000 € - 10.000 €",
            "10.000 €+",
            "Noch offen",
          ],
          startLabel: "Gewünschter Start",
          startOptions: [
            "Sofort",
            "Innerhalb von 2 Wochen",
            "Innerhalb von 1 Monat",
            "Später / flexibel",
          ],
          projectDetailsLabel:
            "Anmerkungen, Anforderungen und Projektbeschreibung",
          projectDetailsPlaceholder:
            "Beschreibe Ziel, Zielgruppe, Deadline, wichtige Seiten/Features und vorhandene Assets.",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemäß",
          privacyLabel: "Datenschutzerklärung zu.",
          mailSubjectPrefix: "Projektanfrage",
          mailBodyTitle: "Neue Projektanfrage",
          mailLabelName: "Name",
          mailLabelEmail: "E-Mail",
          mailLabelPhone: "Telefon",
          mailLabelCompany: "Unternehmen",
          mailLabelRole: "Rolle",
          mailLabelWebsite: "Website",
          mailLabelOffer: "Gewünschtes Angebot",
          mailLabelBudget: "Budgetrahmen",
          mailLabelStart: "Gewünschter Start",
          mailBodyDetailsLabel: "Projektbeschreibung / Anforderungen",
          submitLabel: "Anfrage senden",
          submitSuccess:
            "Dein Mailprogramm wurde mit den vorausgefüllten Anfragedaten geöffnet.",
          requiredHint: "* Pflichtfelder",
          closeLabel: "Formular schließen",
        },
      },
      en: {
        title: "Ready for a new, productive website?",
        description: "Contact me and start your project with Invessiv.",
        summaryPoints: [
          "Reply in 24h",
          "2-3 questions",
          "Direct contact",
        ],
        footerHeroTitle: "Ready for a new, productive website?",
        footerHeroDescription:
          "Contact me and start your project with Invessiv.",
        footerHeroPrimaryCta: { label: "Start project now", href: "#contact" },
        footerHeroSecondaryCta: { label: "View services", href: "#services" },
        footerColumns: [
          {
            title: "Menu",
            links: [
              { label: "Proof", href: "#proof" },
              { label: "Services & Pricing", href: "#services" },
              { label: "Process", href: "#process" },
              { label: "FAQ", href: "#faq" },
              { label: "Contact", href: "#contact" },
            ],
          },
          {
            title: "Contact",
            links: [
              { label: "Invessiv", href: "/imprint#company-details" },
              { label: COMPANY.contact.email, href: COMPANY_MAILTO },
              { label: COMPANY.contact.phoneDisplayEn, href: COMPANY_TEL },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "© 2024 Moritz Hecht – Invessiv. All rights reserved.",
        footerSocialLinks: [
          {
            platform: "linkedin",
            href: COMPANY_SOCIAL_LINKEDIN,
            label: "LinkedIn",
          },
          { platform: "x", href: COMPANY_SOCIAL_X, label: "X" },
          {
            platform: "instagram",
            href: COMPANY_SOCIAL_INSTAGRAM,
            label: "Instagram",
          },
        ],
        footerLegalLinks: [
          { label: "Imprint", href: "/imprint" },
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
        contactChannels: [
          {
            label: "Email",
            value: COMPANY.contact.email,
            href: COMPANY_MAILTO,
            hint: "Best for scope, assets, and detailed context",
            actionLabel: "Request by email",
            copyValue: COMPANY.contact.email,
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
          hint: "No commitment. Answer 2-3 short questions and I reply in 24h with a clear next step.",
        },
        contactSecondaryCta: {
          label: "View services",
          href: "#services",
          hint: "",
        },
        contactForm: {
          title: "Project request in 2 minutes",
          subtitle:
            "A short scope check so I can recommend the next practical step right away.",
          intro:
            "The clearer your input, the faster I can return with a concrete recommendation for scope, timing, and budget.",
          conditionalFieldHint:
            "Based on your selected offer, I reveal only the required fields that matter.",
          firstNameLabel: "First name",
          lastNameLabel: "Last name",
          emailLabel: "Business email",
          phoneLabel: "Phone",
          companyLabel: "Company",
          roleLabel: "Role",
          websiteLabel: "Current website",
          websiteRequiredHint:
            "For website upgrade, websites, and maintenance, the current website is required.",
          offerLabel: "Requested offer",
          offerPlaceholder: "Select an offer",
          goalLabel: "Primary landing page goal",
          goalOptions: [
            "Generate leads/inquiries",
            "Increase booked calls",
            "Sell a product",
            "Grow newsletter sign-ups",
          ],
          pagesLabel: "Required pages",
          pagesPlaceholder: "e.g. Home, Services, About, Contact, Careers",
          workflowLabel: "Number of core workflows",
          workflowOptions: ["1 workflow", "2 workflows", "3+ workflows"],
          budgetLabel: "Budget range",
          budgetOptions: [
            "Below €1,000",
            "€1,000 - €2,500",
            "€2,500 - €5,000",
            "€5,000 - €10,000",
            "€10,000+",
            "Not defined yet",
          ],
          startLabel: "Preferred start",
          startOptions: [
            "Immediately",
            "Within 2 weeks",
            "Within 1 month",
            "Later / flexible",
          ],
          projectDetailsLabel: "Notes, requirements, and project description",
          projectDetailsPlaceholder:
            "Describe your goal, audience, timeline, key pages/features, and available assets.",
          consentLabel:
            "I agree to the processing of my information according to the",
          privacyLabel: "privacy policy.",
          mailSubjectPrefix: "Project request",
          mailBodyTitle: "New project request",
          mailLabelName: "Name",
          mailLabelEmail: "Email",
          mailLabelPhone: "Phone",
          mailLabelCompany: "Company",
          mailLabelRole: "Role",
          mailLabelWebsite: "Website",
          mailLabelOffer: "Requested offer",
          mailLabelBudget: "Budget range",
          mailLabelStart: "Preferred start",
          mailBodyDetailsLabel: "Project description / requirements",
          submitLabel: "Send request",
          submitSuccess:
            "Your email app has been opened with the prefilled request details.",
          requiredHint: "* Required fields",
          closeLabel: "Close form",
        },
      },
    },
  },
  {
    id: "footer",
    copy: {
      de: {
        title: "Footer",
        description:
          "Schnellzugriff auf die wichtigsten Bereiche und Kontaktwege.",
        footerHeroTitle: "Bereit für eine neue, produktive Website?",
        footerHeroDescription:
          "Kontaktiere uns und starte dein Projekt mit Invessiv.",
        footerHeroPrimaryCta: {
          label: "Jetzt Projekt anfragen",
          href: "#contact",
        },
        footerHeroSecondaryCta: {
          label: "Leistungen ansehen",
          href: "#services",
        },
        footerColumns: [
          {
            title: "Menü",
            links: [
              { label: "Ergebnisse", href: "#proof" },
              { label: "Leistungen & Preise", href: "#services" },
              { label: "Prozess", href: "#process" },
              { label: "FAQ", href: "#faq" },
              { label: "Kontakt", href: "#contact" },
            ],
          },
          {
            title: "Kontakt",
            links: [
              { label: "Invessiv", href: "/imprint#company-details" },
              { label: COMPANY.contact.email, href: COMPANY_MAILTO },
              { label: COMPANY.contact.phoneDisplayDe, href: COMPANY_TEL },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "© 2026 Moritz Hecht – Invessiv. Alle Rechte vorbehalten.",
        footerSocialLinks: [
          {
            platform: "linkedin",
            href: COMPANY_SOCIAL_LINKEDIN,
            label: "LinkedIn",
          },
          { platform: "x", href: COMPANY_SOCIAL_X, label: "X" },
          {
            platform: "instagram",
            href: COMPANY_SOCIAL_INSTAGRAM,
            label: "Instagram",
          },
        ],
        footerLegalLinks: [
          { label: "Impressum", href: "/imprint" },
          { label: "Datenschutz", href: "/privacy" },
          { label: "AGB", href: "/terms" },
        ],
        footerBottomNote: "Inhaber: Moritz Hecht",
      },
      en: {
        title: "Footer",
        description: "Quick access to core pages and contact options.",
        footerHeroTitle: "Ready for a new, productive website?",
        footerHeroDescription:
          "Contact me and start your project with Invessiv.",
        footerHeroPrimaryCta: { label: "Start project now", href: "#contact" },
        footerHeroSecondaryCta: { label: "View services", href: "#services" },
        footerColumns: [
          {
            title: "Menu",
            links: [
              { label: "Proof", href: "#proof" },
              { label: "Services & Pricing", href: "#services" },
              { label: "Process", href: "#process" },
              { label: "FAQ", href: "#faq" },
              { label: "Contact", href: "#contact" },
            ],
          },
          {
            title: "Contact",
            links: [
              { label: "Invessiv", href: "/imprint#company-details" },
              { label: COMPANY.contact.email, href: COMPANY_MAILTO },
              { label: COMPANY.contact.phoneDisplayEn, href: COMPANY_TEL },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "© 2026 Moritz Hecht – Invessiv. All rights reserved.",
        footerSocialLinks: [
          {
            platform: "linkedin",
            href: COMPANY_SOCIAL_LINKEDIN,
            label: "LinkedIn",
          },
          { platform: "x", href: COMPANY_SOCIAL_X, label: "X" },
          {
            platform: "instagram",
            href: COMPANY_SOCIAL_INSTAGRAM,
            label: "Instagram",
          },
        ],
        footerLegalLinks: [
          { label: "Imprint", href: "/imprint" },
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
        footerBottomNote: "Owner: Moritz Hecht",
      },
    },
  },
];

export function getHomeSections(locale: Locale): HomeSectionContent[] {
  const localizeLegalHref = (href: string) => {
    if (!href.startsWith("/")) {
      return href;
    }

    return href
      .replace("/imprint", LEGAL_PAGE_HREFS[locale].imprint)
      .replace("/privacy", LEGAL_PAGE_HREFS[locale].privacy)
      .replace("/terms", LEGAL_PAGE_HREFS[locale].terms);
  };

  return HOME_SECTIONS.map((section) => {
    const localizedSection = {
      id: section.id,
      ...section.copy[locale],
    };

    return {
      ...localizedSection,
      footerColumns: localizedSection.footerColumns?.map((column) => ({
        ...column,
        links: column.links.map((link) => ({
          ...link,
          href: localizeLegalHref(link.href),
        })),
      })),
      footerSocialLinks: localizedSection.footerSocialLinks?.map((link) => ({
        ...link,
        href: localizeLegalHref(link.href),
      })),
      footerLegalLinks: localizedSection.footerLegalLinks?.map((link) => ({
        ...link,
        href: localizeLegalHref(link.href),
      })),
    };
  });
}


