import type { SectionId } from "@/config/site";
import type { Locale } from "@/config/i18n";

export type LandingSectionCopy = {
  title: string;
  description: string;
  metrics?: Array<{ label: string; value: string }>;
  cards?: Array<{ title: string; description: string; tag: string }>;
  serviceCards?: Array<{
    key:
      | "ai"
      | "landing"
      | "process"
      | "web"
      | "upgrade"
      | "maintenance";
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
          "Du gibst nur den nötigen Input, wir übernehmen den Rest: Landingpages, Webseiten und Prozess-Tools mit schneller Umsetzung bis zum produktiven Ergebnis.",
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
        title: "Leistungen & Preise",
        description:
          "Projektbasierte, einmalige Preise mit klarem Scope, transparenter Lieferzeit und direktem Weg zur Anfrage.",
        serviceCards: [
          {
            key: "landing",
            iconSrc: "/services/01_landingpages.png",
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
            iconSrc: "/services/02_websites.png",
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
            iconSrc: "/services/03_tools.png",
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
            iconSrc: "/services/04_website_upgrade.png",
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
              "Optional auch als laufende Unterstützung mit 50 € / h.",
              "Größere Rebuild-Themen werden transparent separat empfohlen.",
              "Tiefe Backend-Refactors sind nicht Teil des Basis-Upgrades.",
            ],
          },
          {
            key: "ai",
            iconSrc: "/services/05_ai_tempaltes.png",
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
            iconSrc: "/services/06_support.png",
            iconAlt: "Wartung und Support Icon",
            title: "Wartung & Support",
            description:
              "Schnelle Änderungen, Bugfixes und Pflege – flexibel nach Bedarf.",
            price: "50 € / h",
            delivery: "i.d.R. 24–72h",
            deliveryLabel: "Reaktionszeit",
            included: [
              "Kleine Änderungen & Content-Pflege",
              "Bugfixes & Updates",
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
        serviceCards: [
          {
            key: "landing",
            iconSrc: "/services/01_landingpages.png",
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
            iconSrc: "/services/02_websites.png",
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
            iconSrc: "/services/03_tools.png",
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
            iconSrc: "/services/04_website_upgrade.png",
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
              "Optional hourly support also possible at €50 / h.",
              "Larger rebuild topics are transparently scoped separately.",
              "Deep backend refactors are outside base upgrade scope.",
            ],
          },
          {
            key: "ai",
            iconSrc: "/services/05_ai_tempaltes.png",
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
            iconSrc: "/services/06_support.png",
            iconAlt: "Maintenance and support icon",
            title: "Maintenance & support",
            description:
              "Fast edits, bugfixes, and upkeep with flexible hourly support.",
            price: "€50 / h",
            delivery: "typically 24–72h",
            deliveryLabel: "Response time",
            included: [
              "Small changes and content updates",
              "Bugfixes and routine updates",
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
          "Ob Landingpage, komplette Website, Upgrade oder Tool/Template: Du gibst Ziel und Angebot vor, wir liefern Draft, Feinschliff und Launch.",
        processSummary:
          "Typisch: erste Version in 48h (je nach Scope) | 1-2 Feedbackrunden | Go-live oder Übergabe inklusive QA",
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
        description:
          "The most relevant questions about process and collaboration, clear and direct.",
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
        title: "Bereit für eine neue, produktive Website?",
        description: "Kontaktiere uns und starte dein Projekt mit Invessiv.",
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
              { label: "Kontakt", href: "#contact" },
            ],
          },
          {
            title: "Leistungen",
            links: [
              { label: "Landing pages", href: "#services" },
              { label: "Webdesign", href: "#services" },
              { label: "Webentwicklung", href: "#services" },
              { label: "Prozess-Tools", href: "#services" },
            ],
          },
          {
            title: "Kontakt",
            links: [
              { label: "Invessiv", href: "/imprint#company-details" },
              { label: "info@invessiv.de", href: "mailto:info@invessiv.de" },
              { label: "0170 / 12345678", href: "tel:+4917012345678" },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "© 2024 Invessiv. Alle Rechte vorbehalten.",
        footerSocialLinks: [
          {
            platform: "linkedin",
            href: "/imprint#placeholder-social-linkedin",
            label: "LinkedIn",
          },
          { platform: "x", href: "/imprint#placeholder-social-x", label: "X" },
          {
            platform: "instagram",
            href: "/imprint#placeholder-social-instagram",
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
        description: "Contact us and start your project with Invessiv.",
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
              { label: "Leistungen & Preise", href: "#services" },
              { label: "Contact", href: "#contact" },
            ],
          },
          {
            title: "Services",
            links: [
              { label: "Landing pages", href: "#services" },
              { label: "Web design", href: "#services" },
              { label: "Web development", href: "#services" },
              { label: "Process tools", href: "#services" },
            ],
          },
          {
            title: "Contact",
            links: [
              { label: "Invessiv", href: "/imprint#company-details" },
              { label: "info@invessiv.de", href: "mailto:info@invessiv.de" },
              { label: "+49 170 12345678", href: "tel:+4917012345678" },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "© 2024 Invessiv. All rights reserved.",
        footerSocialLinks: [
          {
            platform: "linkedin",
            href: "/imprint#placeholder-social-linkedin",
            label: "LinkedIn",
          },
          { platform: "x", href: "/imprint#placeholder-social-x", label: "X" },
          {
            platform: "instagram",
            href: "/imprint#placeholder-social-instagram",
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
              { label: "Kontakt", href: "#contact" },
            ],
          },
          {
            title: "Leistungen",
            links: [
              { label: "Landing pages", href: "#services" },
              { label: "Webdesign", href: "#services" },
              { label: "Webentwicklung", href: "#services" },
              { label: "Prozess-Tools", href: "#services" },
            ],
          },
          {
            title: "Kontakt",
            links: [
              { label: "Invessiv", href: "/imprint#company-details" },
              { label: "info@invessiv.de", href: "mailto:info@invessiv.de" },
              { label: "0170 / 12345678", href: "tel:+4917012345678" },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "© 2026 Invessiv. Alle Rechte vorbehalten.",
        footerSocialLinks: [
          {
            platform: "linkedin",
            href: "/imprint#placeholder-social-linkedin",
            label: "LinkedIn",
          },
          { platform: "x", href: "/imprint#placeholder-social-x", label: "X" },
          {
            platform: "instagram",
            href: "/imprint#placeholder-social-instagram",
            label: "Instagram",
          },
        ],
        footerLegalLinks: [
          { label: "Impressum", href: "/imprint" },
          { label: "Datenschutz", href: "/privacy" },
          { label: "AGB", href: "/terms" },
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
              { label: "Leistungen & Preise", href: "#services" },
              { label: "Contact", href: "#contact" },
            ],
          },
          {
            title: "Services",
            links: [
              { label: "Landing pages", href: "#services" },
              { label: "Web design", href: "#services" },
              { label: "Web development", href: "#services" },
              { label: "Process tools", href: "#services" },
            ],
          },
          {
            title: "Contact",
            links: [
              { label: "Invessiv", href: "/imprint#company-details" },
              { label: "info@invessiv.de", href: "mailto:info@invessiv.de" },
              { label: "+49 170 12345678", href: "tel:+4917012345678" },
            ],
          },
        ],
        footerBrand: "Invessiv",
        footerCopyright: "© 2026 Invessiv. All rights reserved.",
        footerSocialLinks: [
          {
            platform: "linkedin",
            href: "/imprint#placeholder-social-linkedin",
            label: "LinkedIn",
          },
          { platform: "x", href: "/imprint#placeholder-social-x", label: "X" },
          {
            platform: "instagram",
            href: "/imprint#placeholder-social-instagram",
            label: "Instagram",
          },
        ],
        footerLegalLinks: [
          { label: "Imprint", href: "/imprint" },
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
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
