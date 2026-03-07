import type { SectionId } from "@/config/site";
import type { Locale } from "@/config/i18n";
import {
  COMPANY,
  COMPANY_CALENDLY,
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
  qnaSecondaryContact?: {
    hint: string;
    label: string;
    href: string;
  };
  contactDecisionIntro?: string;
  contactChannels?: Array<{
    mode?: "email" | "call";
    kicker?: string;
    label: string;
    description?: string;
    value: string;
    href: string;
    hint?: string;
    actionLabel?: string;
    copyValue?: string;
    copyLabel?: string;
    copiedLabel?: string;
    helper?: string;
    detailPoints?: string[];
    metaLabel?: string;
    metaValue?: string;
  }>;
  contactChecklist?: string[];
  contactChecklistTitle?: string;
  contactChecklistHint?: string;
  contactCta?: {
    kicker?: string;
    label: string;
    href: string;
    description?: string;
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
    pagesOptions?: string[];
    pagesCustomLabel?: string;
    pagesCustomPlaceholder?: string;
    pagesRequiredHint?: string;
    workflowLabel: string;
    workflowOptions: string[];
    stepNavigationLabel: string;
    stepLabel: string;
    stepOneTitle: string;
    stepTwoTitle: string;
    stepThreeTitle: string;
    previousStepLabel: string;
    nextStepLabel: string;
    nextStepContactLabel?: string;
    nextStepProjectLabel?: string;
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
    closeLabel?: string;
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
        description: "",
        qnaSecondaryContact: {
          hint: "Frage nicht dabei?",
          label: "Schreib mir direkt per Mail.",
          href: COMPANY_MAILTO,
        },
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
        description: "",
        qnaSecondaryContact: {
          hint: "Question not listed?",
          label: "Write to me directly by email.",
          href: COMPANY_MAILTO,
        },
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
        title: "Wähle den passenden Einstieg für dein Projekt",
        description:
          "Drei Wege, ein Ziel: schnell den sinnvollsten nächsten Schritt für dein Vorhaben finden.",
        summaryPoints: [
          "3 Wege je nach Projektstand",
          "Meist Rückmeldung innerhalb von 24h",
          "Direkter Kontakt ohne Vertriebsschleife",
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
        contactDecisionIntro:
          "Wähle den Einstieg, der jetzt passt: Projektanfrage, kurze E-Mail oder ein 15-20-Minuten-Kennenlerntermin.",
        contactChannels: [
          {
            mode: "email",
            kicker: "Asynchron & schnell",
            label: "Kurze E-Mail",
            description:
              "Für schnellen Erstkontakt, wenn du den nächsten Schritt kurz per Text klären willst.",
            value: COMPANY.contact.email,
            href: COMPANY_MAILTO,
            helper:
              "2-4 Sätze reichen: Ziel, Kontext und was du als Nächstes brauchst.",
            hint: "Du erhältst eine klare Einschätzung und einen konkreten nächsten Schritt.",
            actionLabel: "E-Mail senden",
            copyValue: COMPANY.contact.email,
            copyLabel: "Adresse kopieren",
            copiedLabel: "Adresse kopiert",
            detailPoints: ["Antwort meist innerhalb von 24h", "Kein Termin nötig"],
            metaLabel: "E-Mail",
            metaValue: "Asynchroner Schnellkontakt",
          },
          {
            mode: "call",
            kicker: "Synchron abstimmen",
            label: "Kennenlern-Call",
            description:
              "Für direkte Abstimmung, wenn Scope und Aufwand im Termin geklärt werden sollen.",
            value: "15-20 Minuten Abstimmung",
            href: COMPANY_CALENDLY,
            helper:
              "In 15-20 Minuten klären wir Ziel, Prioritäten und den sinnvollsten nächsten Schritt.",
            hint: "Terminweg mit klarer Empfehlung im Anschluss.",
            actionLabel: "Termin auswählen",
            detailPoints: [
              "15-20 Minuten fokussiert",
              "Scope und Aufwand grob einordnen",
              "Konkreter nächster Schritt danach",
            ],
            metaLabel: "Format",
            metaValue: "Kurzer Abstimmungstermin (Telefon/Video)",
          },
        ],
        contactChecklist: [
          "Klare Empfehlung",
          "Direkter Kontakt",
          "Scope, Timing, Aufwand",
        ],
        contactChecklistTitle: "Was du in jedem Weg bekommst",
        contactChecklistHint:
          "Unabhängig vom Weg: klare Orientierung statt Sales-Floskeln.",
        contactCta: {
          kicker: "Direkt starten",
          label: "Projektanfrage starten",
          href: "#contact",
          hint: "3 kurze Schritte, nur relevante Pflichtfelder und klare Rückmeldung.",
        },
        contactSecondaryCta: {
          label: "Leistungen vergleichen",
          href: "#services",
          hint: "",
        },
        contactForm: {
          title: "Projektanfrage für konkrete Vorhaben",
          subtitle:
            "Für Vorhaben mit klarer Richtung und Startbereitschaft.",
          intro:
            "Du gibst die wichtigsten Eckdaten an, ich antworte mit einem klaren Vorschlag zu Scope, Timing und Budgetrahmen.",
          conditionalFieldHint:
            "Je nach gewähltem Angebot zeige ich nur die wirklich relevanten Felder.",
          firstNameLabel: "Name",
          lastNameLabel: "Nachname",
          emailLabel: "E-Mail",
          phoneLabel: "Telefon",
          companyLabel: "Unternehmen",
          roleLabel: "Rolle",
          websiteLabel: "Aktuelle Website",
          websiteRequiredHint:
            "Bei Website-Upgrade, Webseiten und Wartung ist die aktuelle Website erforderlich.",
          offerLabel: "Passendes Angebot",
          offerPlaceholder: "Bitte Angebot wählen",
          goalLabel: "Hauptziel der Landingpage",
          goalOptions: [
            "Anfragen erhalten",
            "Terminbuchungen erhöhen",
            "Produkt verkaufen",
            "Newsletter-Anmeldungen",
          ],
          pagesLabel: "Benötigte Seiten",
          pagesPlaceholder: "z. B. Referenzen, Team, FAQ",
          pagesOptions: [
            "Start",
            "Leistungen",
            "Über uns",
            "Kontakt",
            "Karriere",
            "Blog",
            "Landingpage",
            "Sonstiges",
          ],
          pagesCustomLabel: "Weitere Seiten (optional)",
          pagesCustomPlaceholder: "z. B. Referenzen, Team, FAQ",
          pagesRequiredHint:
            "Bitte wähle mindestens eine Seite oder ergänze eine eigene.",
          workflowLabel: "Anzahl Kern-Workflows",
          workflowOptions: ["1 Workflow", "2 Workflows", "3+ Workflows"],
          stepNavigationLabel: "Anfragefortschritt",
          stepLabel: "Schritt",
          stepOneTitle: "Kontakt",
          stepTwoTitle: "Projektdetails",
          stepThreeTitle: "Rahmen",
          previousStepLabel: "Zurück",
          nextStepLabel: "Weiter",
          nextStepContactLabel: "Weiter zu Projektdetails",
          nextStepProjectLabel: "Weiter zu Rahmen & Versand",
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
          projectDetailsLabel: "Projektziel und Anforderungen",
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
        title: "Choose the right entry point for your project",
        description:
          "Three paths, one goal: move to the most practical next step quickly.",
        summaryPoints: [
          "3 paths based on project clarity",
          "Usually a reply within 24h",
          "Direct contact without sales handoff",
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
        contactDecisionIntro:
          "Pick the path that fits now: project request, short email, or a focused 15-20 minute call.",
        contactChannels: [
          {
            mode: "email",
            kicker: "Async & low effort",
            label: "Short email",
            description:
              "Best for fast async contact when you want to clarify the next step in writing.",
            value: COMPANY.contact.email,
            href: COMPANY_MAILTO,
            helper: "2-4 lines are enough: goal, context, and what you need next.",
            hint: "You get a clear assessment and a concrete next step.",
            actionLabel: "Send email",
            copyValue: COMPANY.contact.email,
            copyLabel: "Copy address",
            copiedLabel: "Address copied",
            detailPoints: [
              "Usually a reply within 24h",
              "No scheduling needed",
            ],
            metaLabel: "Email",
            metaValue: "Asynchronous quick contact",
          },
          {
            mode: "call",
            kicker: "Sync alignment",
            label: "Discovery call",
            description:
              "Best for live alignment when scope and effort need quick discussion.",
            value: "15-20 minute alignment call",
            href: COMPANY_CALENDLY,
            helper:
              "In 15-20 minutes we align on goals, priorities, and the strongest next step.",
            hint: "Scheduling path with a clear recommendation afterward.",
            actionLabel: "Choose a time",
            detailPoints: [
              "15-20 minutes focused",
              "Roughly map scope & effort",
              "Leave with a concrete next step",
            ],
            metaLabel: "Format",
            metaValue: "Short call (phone/video)",
          },
        ],
        contactChecklist: [
          "Clear recommendation",
          "Direct contact",
          "Scope, timing, effort",
        ],
        contactChecklistTitle: "What you get in every path",
        contactChecklistHint:
          "Whichever path you choose, you leave with practical clarity.",
        contactCta: {
          kicker: "Start directly",
          label: "Start project request",
          href: "#contact",
          hint: "3 short steps, only relevant required fields, and a clear reply.",
        },
        contactSecondaryCta: {
          label: "Compare services",
          href: "#services",
          hint: "",
        },
        contactForm: {
          title: "Project request for concrete scopes",
          subtitle:
            "Best when direction is clear and you want to move directly.",
          intro:
            "Share the key project facts and I reply with a practical scope, timing, and budget recommendation.",
          conditionalFieldHint:
            "Based on your offer, I only show fields that are actually relevant.",
          firstNameLabel: "Name",
          lastNameLabel: "Last name",
          emailLabel: "Email",
          phoneLabel: "Phone",
          companyLabel: "Company",
          roleLabel: "Role",
          websiteLabel: "Current website",
          websiteRequiredHint:
            "For website upgrade, websites, and maintenance, the current website is required.",
          offerLabel: "Relevant offer",
          offerPlaceholder: "Select an offer",
          goalLabel: "Primary landing page goal",
          goalOptions: [
            "Generate inquiries",
            "Increase booked calls",
            "Sell a product",
            "Grow newsletter sign-ups",
          ],
          pagesLabel: "Required pages",
          pagesPlaceholder: "e.g. References, Team, FAQ",
          pagesOptions: [
            "Home",
            "Services",
            "About",
            "Contact",
            "Careers",
            "Blog",
            "Landing page",
            "Other",
          ],
          pagesCustomLabel: "Additional pages (optional)",
          pagesCustomPlaceholder: "e.g. References, Team, FAQ",
          pagesRequiredHint:
            "Please select at least one page or add your own.",
          workflowLabel: "Number of core workflows",
          workflowOptions: ["1 workflow", "2 workflows", "3+ workflows"],
          stepNavigationLabel: "Request progress",
          stepLabel: "Step",
          stepOneTitle: "Contact",
          stepTwoTitle: "Project details",
          stepThreeTitle: "Timing",
          previousStepLabel: "Back",
          nextStepLabel: "Continue",
          nextStepContactLabel: "Continue to project details",
          nextStepProjectLabel: "Continue to timing & send",
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
