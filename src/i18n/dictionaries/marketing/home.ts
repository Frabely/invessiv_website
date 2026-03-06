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
          "Du gibst Ziel, Angebot und Kontext vor, ich setze dein Projekt im KI-Agenten-Workflow um: Agent-Setup, Build, Feinschliff und QA.",
      },
      en: {
        title:
          "Digital solutions that create visible impact and simplify processes.",
        description:
          "You provide goal, offer, and context, and I execute your project in an AI agent workflow: agent setup, build, refinement, and QA.",
      },
    },
  },
  {
    id: "proof",
    copy: {
      de: {
        title: "Ergebnisse",
        description:
          "Nachvollziehbare Ergebnisse und klare Liefer-Signale statt Bauchgefühl.",
        metrics: [
          { label: "Erster Draft", value: "typisch 5 Werktage" },
          { label: "Abstimmung", value: "klar strukturiert" },
          { label: "Verantwortung", value: "1 Ansprechpartner" },
        ],
        cards: [
          {
            title: "Typischer Liefer-Rhythmus",
            description:
              "Erste klickbare Version typischerweise in 5 Werktagen mit klarem Go-live-Plan je Paket.",
            tag: "Richtwert",
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
          { label: "First draft", value: "typically 5 business days" },
          { label: "Alignment", value: "structured" },
          { label: "Delivery responsibility", value: "1 point of contact" },
        ],
        cards: [
          {
            title: "Typical delivery rhythm",
            description:
              "First clickable version typically in 5 business days with a clear go-live plan per package.",
            tag: "Guideline",
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
          "Projektbasierte, einmalige Preise mit klarem Leistungsumfang, transparenter Lieferzeit und direktem Weg zur Anfrage.",
        summaryPoints: [
          "Einmalpreise pro Projekt",
          "Leistungsumfang vor Start definiert",
          "Lieferzeit als Richtwert im Angebot",
        ],
        serviceCards: [
          {
            key: "landing",
            iconSrc: "/services/website-layout-icon.svg",
            iconAlt: "Landingpages Icon",
            title: "Landingpages",
            description:
              "Conversion-optimierte One-Pager mit klarer Botschaft und starker Performance.",
            isRecommended: true,
            price: "ab 990 € einmalig",
            delivery: "3–7 Tage",
            included: [
              "Klare Seitenstruktur (Hero, Vorteile, CTA, FAQ)",
              "Responsives Design (mobile-first)",
              "Basis-SEO: Meta-Daten, Open Graph, Indexierbarkeit",
              "Performance-Optimierung mit Fokus auf Core Web Vitals",
              "1–2 Feedbackrunden inklusive",
            ],
            details: [
              "Copy-Feinschliff oder Inhaltsproduktion als Zusatzleistung möglich.",
              "Ab der 3. Feedbackrunde kalkuliere ich transparent nach.",
              "Hosting, Domain und externe Tool-Lizenzen sind nicht im Preis enthalten.",
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
              "Individuelles Design-System (erweiterbar)",
              "Klare Seitenstruktur und Navigation",
              "CMS-Setup bzw. pflegeleichte Struktur (stackabhängig)",
              "Performance- und technische SEO-Basics",
              "Kontakt- bzw. Lead-Flow inkl. Formular",
              "Deployment/Go-Live Support",
            ],
            details: [
              "Zusätzliche Seiten und Mehrsprachigkeit planen wir vor Start verbindlich ein.",
              "CMS-Integration erfolgt nur, wenn sie im gewählten Stack sinnvoll ist.",
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
              "Kompakter Scope-Workshop (Ziel, Daten, Rollen)",
              "MVP-Umsetzung mit einem Kern-Workflow",
              "Status- oder Dashboard-Ansicht für Transparenz",
              "Integrationen je nach Umfang (Webhooks, APIs)",
              "Basis für Login- und Rechtekonzept",
              "Übergabe inkl. Kurz-Dokumentation",
            ],
            details: [
              "Weitere Workflows setzen wir als Folgepakete um.",
              "Enterprise-Authentifizierung (z. B. SSO) ist nicht im Basis-MVP enthalten.",
              "Betrieb, Monitoring und laufender Support sind separat buchbar.",
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
              "Performance-Audit mit priorisierten Quick Wins",
              "Gezielter UX/UI-Refresh",
              "Technische SEO-Basics (Indexierung, Struktur)",
              "Responsive- und Accessibility-Basics",
              "Code- und CSS-Cleanup, wo sinnvoll",
              "Vorher-Nachher-Check der wichtigsten Verbesserungen",
            ],
            details: [
              "Optional im Stundenmodell: Entwicklung 70–85 €/h, Content/kleine Pflege 50–60 €/h.",
              "Größere Rebuild-Themen werden separat empfohlen und geplant.",
              "Tiefe Backend-Refactorings sind nicht im Basis-Upgrade enthalten.",
            ],
          },
          {
            key: "ai",
            iconSrc: "/services/ai-file-icon.svg",
            iconAlt: "KI-Templates & Agents Icon",
            title: "KI-Templates & Agents",
            description:
              "Einsatzbereite Agent-Templates und Agent-Setups als Basis für einen KI-Agenten-Workflow mit schnellerem Projektstart.",
            price: "ab 290 € einmalig",
            delivery: "2–5 Tage",
            included: [
              "Ein Agent-Setup inkl. passender Startvorlage für deinen Anwendungsfall",
              "Klare Rollen, Workflow- und Qualitätsregeln",
              "Prompt-Struktur mit Eingabe- und Ausgabevorlagen",
              "Abstimmung auf Tonalität, Angebot und Fachsprache",
              "Kurzleitfaden für den direkten Projektstart",
            ],
            details: [
              "Weitere Varianten oder zusätzliche Anwendungsfälle können flexibel ergänzt werden.",
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
              "Content- und Kleinpflege: 50–60 €/h",
              "Entwicklung und Implementierung: 70–85 €/h",
              "Auf Wunsch regelmäßige Monitoring- und Qualitätschecks",
              "Wichtige Themen zuerst (nach Business-Impact)",
              "Transparente Stundenpakete (z. B. 5 oder 10 Stunden)",
            ],
            details: [
              "Du zahlst nur den tatsächlichen Aufwand mit klarer Aufstellung.",
              "Notfallanfragen priorisiere ich nach Verfügbarkeit.",
            ],
          },
        ],
      },
      en: {
        title: "Services & Pricing",
        description:
          "Project-based one-time pricing with transparent scope, clear delivery windows, and direct contact CTA.",
        summaryPoints: [
          "One-time pricing per project",
          "Scope defined before kickoff",
          "Delivery window set as a guideline upfront",
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
              "Clear page structure (hero, benefits, CTA, FAQ)",
              "Responsive design (mobile-first)",
              "Basic SEO: metadata, Open Graph, indexability",
              "Performance optimization focused on Core Web Vitals",
              "1–2 feedback rounds included",
            ],
            details: [
              "Copy refinement or content production is available as an add-on.",
              "From the 3rd feedback round onward, additional effort is scoped transparently.",
              "Hosting, domain, and external tool licenses are not included.",
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
              "Custom design system (extendable)",
              "Clear site structure and navigation",
              "CMS setup or low-maintenance structure (stack dependent)",
              "Performance and technical SEO basics",
              "Contact or lead flow including form",
              "Deployment/go-live support",
            ],
            details: [
              "Additional pages and multilingual scope are planned upfront.",
              "CMS integration is included only when it fits the selected stack.",
              "Third-party licenses and external integrations are not included in the base price.",
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
              "Compact scope workshop (goals, data, roles)",
              "MVP implementation with one core workflow",
              "Status or dashboard view for transparency",
              "Integrations by scope (webhooks, APIs)",
              "Foundation for login and access roles",
              "Handover including short documentation",
            ],
            details: [
              "Additional workflows are delivered as follow-up modules.",
              "Enterprise authentication (e.g. SSO) is not part of the base MVP.",
              "Operations, monitoring, and ongoing support are available separately.",
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
              "Performance audit with prioritized quick wins",
              "Targeted UX/UI refresh",
              "Technical SEO basics (indexing, structure)",
              "Responsiveness and accessibility basics",
              "Code and CSS cleanup where it adds value",
              "Before/after check of key improvements",
            ],
            details: [
              "Optional hourly model: development at €70–85/h, content/small updates at €50–60/h.",
              "Larger rebuild topics are recommended and scoped separately.",
              "Deep backend refactoring is not included in the base upgrade.",
            ],
          },
          {
            key: "ai",
            iconSrc: "/services/ai-file-icon.svg",
            iconAlt: "AI templates & agents icon",
            title: "AI templates & agents",
            description:
              "Ready-to-use agent templates and agent setups as a base for an AI agent workflow with faster project starts.",
            price: "from €290 one-time",
            delivery: "2–5 days",
            included: [
              "One agent setup with a matching starter template for your use case",
              "Clear role, workflow, and quality rules",
              "Prompt structure with input and output templates",
              "Aligned with your tone, offer, and domain language",
              "Short guide for a direct project start",
            ],
            details: [
              "Additional variants or use cases can be added flexibly.",
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
              "Content and minor updates: €50–60/h",
              "Development and implementation: €70–85/h",
              "Optional recurring monitoring and quality checks",
              "High-impact topics first (by business impact)",
              "Transparent hour bundles (e.g. 5 or 10 hours)",
            ],
            details: [
              "You only pay for the actual effort with a clear breakdown.",
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
        title: "In wenigen Schritten zum fertigen Ergebnis",
        description:
          "Ablauf mit KI-Fokus: Nach deinen Anforderungen richte ich das Agent-Setup ein, arbeite im KI-Agenten-Workflow und finalisiere mit manuellem Feinschliff und QA.",
        summaryPoints: [
          "Ziel + Angebot in ca. 30 Minuten geklärt",
          "Erster Draft oft in 48h mit KI-Agenten-Build",
          "Go-live inkl. QA und Übergabe",
        ],
        processSteps: [
          {
            step: "01",
            title: "Anforderungen & Agent-Setup",
            deliverable: "30-min Briefing + Agent-Setup",
            effort: "Aufwand: 30 Min",
            result: "Ergebnis: Klarer Leistungsumfang + Prioritäten",
            description:
              "Du teilst Ziel, Angebot und Material. Ich strukturiere die Anforderungen und richte ein kontextspezifisches Agent-Setup ein.",
          },
          {
            step: "02",
            title: "KI-Agenten-Build",
            deliverable: "Lauffähiger Draft oder Prototyp",
            effort: "Lieferzeit: oft innerhalb von 48h (je nach Umfang)",
            result: "Ergebnis: Struktur + Kernlogik",
            description:
              "Auf Basis des Agent-Setups setze ich die erste lauffähige Version im KI-Agenten-Workflow um.",
          },
          {
            step: "03",
            title: "Feinschliff & QA",
            deliverable: "Conversion-Finish",
            effort: "Feedback: 1-2 Runden",
            result: "Ergebnis: Finales Design + Funktionen",
            description:
              "Ich prüfe Ergebnisse, verfeinere Design/Copy/UX und sichere die Qualität für den Launch.",
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
          hint: "Unverbindlich. Meist Rückmeldung innerhalb von 24h.",
          href: "#contact",
        },
      },
      en: {
        title: "A finished result in a few clear steps",
        description:
          "AI-focused delivery flow: after your requirements, I set up the agent foundation, work in an AI agent workflow, and finalize with manual refinement and QA.",
        summaryPoints: [
          "Goal and offer aligned in about 30 minutes",
          "First draft often in 48h via AI agent build",
          "Go-live includes QA and handover",
        ],
        processSteps: [
          {
            step: "01",
            title: "Requirements & agent setup",
            deliverable: "30-min briefing + agent setup",
            effort: "Effort: 30 min",
            result: "Outcome: clear scope + priorities",
            description:
              "You share goals, offer, and materials. I structure requirements and set up a context-specific agent foundation.",
          },
          {
            step: "02",
            title: "AI agent build",
            deliverable: "Working draft or prototype",
            effort: "Delivery: often within 48h (depending on scope)",
            result: "Outcome: structure + core logic",
            description:
              "Based on the agent setup, I build the first working version in an AI agent workflow.",
          },
          {
            step: "03",
            title: "Refinement & QA",
            deliverable: "Conversion finish",
            effort: "Feedback: 1-2 rounds",
            result: "Outcome: final design + functions",
            description:
              "I review the result, refine design/copy/UX, and secure launch quality.",
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
          hint: "No commitment. Usually a reply within 24h.",
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
          "Start, Umfang und Timing klar",
          "Kosten und Grenzen transparent",
          "Technik passend zu deinem Setup",
        ],
        qnaItems: [
          {
            question: "Wie läuft der Projektstart ab?",
            answer:
              "Nach deiner Anfrage kläre ich Ziel, Umfang und Zeitrahmen in einem kurzen Call oder per E-Mail. Danach richte ich ein passendes Agent-Setup für dein Projekt ein und teile den nächsten Schritt mit Zeitrahmen und transparentem Angebot.",
          },
          {
            question: "Kannst du meine bestehende Website überarbeiten?",
            answer:
              "Ja. Ich kann bestehende Seiten gezielt modernisieren, technisch stabilisieren und für Conversion verbessern, ohne alles neu zu bauen. Falls ein kompletter Relaunch sinnvoller ist, sage ich das offen vorab.",
          },
          {
            question: "Welche Tools setzt du ein?",
            answer:
              "Mein Kernworkflow ist Agent-Setup + KI-Agenten-Workflow für die Umsetzung, ergänzt um Next.js, Tailwind, Figma und passende Analyse-/Workflow-Tools. Ich steuere Architektur, Review und QA, damit Übergabe und Wartung sauber funktionieren.",
          },
          {
            question: "Gibt es versteckte Kosten?",
            answer:
              "Nein. Du erhältst vor Start ein klares Angebot mit definiertem Leistungsumfang. Zusätzliche Wünsche außerhalb des Leistungsumfangs stimme ich immer vor Umsetzung transparent mit dir ab.",
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
              "After your request, I align on goals, scope, and timeline in a short call or by email. Then I set up a matching agent foundation for your project and share the next step with timing and transparent pricing.",
          },
          {
            question: "Can you redesign my existing website?",
            answer:
              "Yes. I can modernize existing pages, improve technical stability, and optimize for conversion without rebuilding everything from scratch. If a full relaunch is the better option, I tell you upfront.",
          },
          {
            question: "Which tools do you use?",
            answer:
              "My core workflow is agent setup + AI agent workflow for implementation, complemented by Next.js, Tailwind, Figma, and suitable analytics/workflow tools. I own architecture, review, and QA for clean handover and maintainability.",
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
        description: "Kontaktiere mich und starte dein Projekt mit Invessiv.",
        summaryPoints: [
          "Meist Antwort in 24h",
          "2-3 Fragen",
          "Direkter Kontakt",
        ],
        footerHeroTitle: "Bereit für eine neue, produktive Website?",
        footerHeroDescription:
          "Kontaktiere mich und starte dein Projekt mit Invessiv.",
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
        footerCopyright:
          "© 2026 Moritz Hecht – Invessiv. Alle Rechte vorbehalten.",
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
            hint: "Ideal für Leistungsumfang, Zeitrahmen und vorhandene Assets.",
            actionLabel: "Per E-Mail anfragen",
            copyValue: COMPANY.contact.email,
            copyLabel: "E-Mail kopieren",
            copiedLabel: "Kopiert",
          },
          {
            label: "Kennenlern-Call",
            value: "30 Min. → Umfang + nächster Schritt + grobe Einschätzung",
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
          hint: "Unverbindlich. 2-3 kurze Fragen, dann melde ich mich in der Regel innerhalb von 24h mit dem nächsten Schritt.",
        },
        contactSecondaryCta: {
          label: "Leistungen ansehen",
          href: "#services",
          hint: "",
        },
        contactForm: {
          title: "Projektanfrage in 2 Minuten",
          subtitle:
            "Kurzer Umfangs-Check, damit ich direkt den nächsten sinnvollen Schritt liefern kann.",
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
          "Usually a reply within 24h",
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
          hint: "No commitment. Answer 2-3 short questions and I usually reply within 24h with a clear next step.",
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
          "Kontaktiere mich und starte dein Projekt mit Invessiv.",
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
        footerCopyright:
          "© 2026 Moritz Hecht – Invessiv. Alle Rechte vorbehalten.",
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
