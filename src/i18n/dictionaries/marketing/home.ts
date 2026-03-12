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

type ServiceCardKey =
  | "ai"
  | "landing"
  | "process"
  | "web"
  | "upgrade"
  | "maintenance";

type BaseServiceCard = {
  key: ServiceCardKey;
  iconSrc?: string;
  iconAlt?: string;
  title: string;
  description: string;
  fit?: string;
  isRecommended?: boolean;
};

type StandardServiceCard = BaseServiceCard & {
  isComingSoon?: false;
  price: string;
  delivery: string;
  deliveryLabel?: string;
  included: string[];
  details?: string[];
};

type ComingSoonServiceCard = BaseServiceCard & {
  isComingSoon: true;
  comingSoonExamples?: string[];
};

export type LandingSectionCopy = {
  title: string;
  description: string;
  summaryPoints?: string[];
  cards?: Array<{ title: string; description: string; tag: string }>;
  serviceCards?: Array<StandardServiceCard | ComingSoonServiceCard>;
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
          "Webseiten und Prozess-Tools mit klarem Aufbau, sauberer Umsetzung und direktem Weg zum Ziel.",
        description:
          "Von Landingpage bis Prozess-Tool: mit klarem Setup, direkter Abstimmung und einem Ergebnis, das vor dem Launch geprüft ist.",
      },
      en: {
        title:
          "Websites and process tools with clear structure, clean execution, and a direct path to the goal.",
        description:
          "From landing page to process tool: with a clear setup, direct feedback, and a result that is reviewed before launch.",
      },
    },
  },
  {
    id: "included",
    copy: {
      de: {
        title: "Vom ersten Scope bis zur Übergabe",
        description:
          "Nach der Anfrage weißt du, welcher Einstieg sinnvoll ist und wie es konkret weitergeht.",
        summaryPoints: [
          "Empfehlung vor Start",
          "kurze Abstimmung",
          "QA & Übergabe",
        ],
        cards: [
          {
            title: "Passender Einstieg vor Projektbeginn",
            description:
              "Nach der Anfrage sortieren wir Ziel, Umfang und Angebotsform, bevor die Umsetzung losgeht.",
            tag: "Setup",
          },
          {
            title: "Kurze Wege im Projekt",
            description:
              "Fragen, Feedback und Prioritäten laufen ohne Umwege zwischen uns. Das spart Schleifen und hält Entscheidungen zügig.",
            tag: "Ablauf",
          },
          {
            title: "Launch sauber vorbereitet",
            description:
              "Responsive Checks, technische SEO, QA und Übergabe sind von Anfang an eingeplant statt erst kurz vor Schluss.",
            tag: "QA",
          },
        ],
      },
      en: {
        title: "From first scope to handoff",
        description:
          "After the inquiry, you know which entry point makes sense and how the next step looks.",
        summaryPoints: [
          "recommendation before kickoff",
          "short feedback loops",
          "QA & handover",
        ],
        cards: [
          {
            title: "Right entry point before kickoff",
            description:
              "After the inquiry, we sort the goal, scope, and offer format before implementation begins.",
            tag: "Setup",
          },
          {
            title: "Short paths during execution",
            description:
              "Questions, feedback, and priorities move without detours between us. That cuts extra loops and keeps decisions moving.",
            tag: "Workflow",
          },
          {
            title: "Launch prepared from the start",
            description:
              "Responsive checks, technical SEO, QA, and handover are planned in from the start instead of being added at the end.",
            tag: "QA",
          },
        ],
      },
    },
  },
  {
    id: "services",
    copy: {
      de: {
        title: "Angebote & Einstiegspreise",
        description:
          "Jedes Angebot ist auf ein klares Problem, einen sichtbaren Leistungsumfang und einen realistischen Einstiegspreis heruntergebrochen.",
        summaryPoints: [
          "klarer Einstieg je Problem",
          "Scope vor Start verbindlich",
          "Lieferfenster und Preisanker sichtbar",
        ],
        serviceCards: [
          {
            key: "landing",
            iconSrc: "/services/website-layout-icon.svg",
            iconAlt: "Landingpages Icon",
            title: "Landingpages",
            description:
              "Landingpage mit klarer Angebotsstruktur, stärkerem CTA-Fluss und sauberer technischer Basis.",
            fit: "Einzelne Angebotsseiten, Kampagnen oder neue Angebote, die schnell live gehen sollen.",
            isRecommended: true,
            price: "ab 990 € einmalig",
            delivery: "3–7 Tage",
            included: [
              "Klare Angebots- und CTA-Struktur für dein Hauptziel",
              "Mobile-first Design mit sauberer Leseführung",
              "Technische Basis für SEO, Open Graph und Indexierung",
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
              "Website-Relaunch oder Unternehmensseite mit besserer Positionierung und klareren Nutzerwegen.",
            fit: "Relaunches oder Unternehmensseiten mit mehreren Kernseiten und klarer Lead-Zielsetzung.",
            price: "ab 2.490 € einmalig",
            delivery: "7–14 Tage",
            included: [
              "Positionierung, Seitenstruktur und Navigation mit klarer Journey",
              "Erweiterbares Design-System statt Einmal-Layout",
              "CMS-Setup bzw. pflegeleichte Struktur je nach Stack",
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
              "Kleines Tool, das manuelle Arbeit reduziert und interne Schritte transparenter macht.",
            fit: "Teams, die wiederkehrende interne Schritte strukturieren oder teilweise automatisieren wollen.",
            price: "ab 3.490 € einmalig",
            delivery: "10–21 Tage",
            included: [
              "Kompakter Scope-Workshop zu Ziel, Daten und Rollen",
              "MVP mit einem Kern-Workflow, der spürbar entlastet",
              "Status- oder Dashboard-Ansicht für mehr Transparenz",
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
            title: "Website-Upgrade",
            description:
              "Mehr Speed, bessere UX, klarere CTAs und moderneres UI ohne kompletten Neubau.",
            fit: "Bestehende Seiten mit gutem Kern, aber schwächerer Klarheit, UX oder Performance.",
            price: "ab 750 € einmalig",
            delivery: "3–10 Tage",
            included: [
              "Priorisierte Quick Wins für Speed, UX und mobile Klarheit",
              "Gezielter Refresh für Hierarchie, CTA und Leseführung",
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
            isComingSoon: true,
            description:
              "KI-Agents und Skills als Download für konkrete Aufgaben.",
            comingSoonExamples: [
              "API Setup mit User-Login",
              "Agent für das Erstellen eigener Webseiten",
              "Konkrete Skills für spezielle Anwendungsfälle",
              "Weitere konkrete Setups und Skills folgen",
            ],
          },
          {
            key: "maintenance",
            iconSrc: "/services/customer-service-icon.svg",
            iconAlt: "Wartung und Support Icon",
            title: "Wartung & Support",
            description:
              "Schnelle Weiterentwicklung, Bugfixes und Pflege für bestehende Seiten oder Tools.",
            fit: "Bestehende Seiten oder Tools, die laufend weiterentwickelt statt komplett neu gebaut werden.",
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
        title: "Offers & Starting Prices",
        description:
          "Each offer is framed around a clear problem, a visible scope, and a realistic starting price so you can assess fit faster.",
        summaryPoints: [
          "clear entry point per problem",
          "scope aligned before kickoff",
          "delivery window and price anchor visible",
        ],
        serviceCards: [
          {
            key: "landing",
            iconSrc: "/services/website-layout-icon.svg",
            iconAlt: "Landing pages icon",
            title: "Landing pages",
            description:
              "Landing page with a clearer offer structure, stronger CTA flow, and a clean technical foundation.",
            fit: "Single offer pages, campaigns, or new offers that should go live quickly.",
            isRecommended: true,
            price: "from €990 one-time",
            delivery: "3–7 days",
            included: [
              "Clear offer and CTA structure around your main goal",
              "Mobile-first design with cleaner reading flow",
              "Technical setup for SEO, Open Graph, and indexability",
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
              "Company website or relaunch with clearer positioning and more obvious user paths.",
            fit: "Relaunches or company sites with multiple core pages and a clear lead goal.",
            price: "from €2,490 one-time",
            delivery: "7–14 days",
            included: [
              "Positioning, site structure, and navigation with a clearer journey",
              "Extendable design system instead of a one-off layout",
              "CMS setup or low-maintenance content structure by stack",
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
              "Small internal tool that reduces manual work and creates more transparency.",
            fit: "Teams that want to structure or partially automate recurring internal steps.",
            price: "from €3,490 one-time",
            delivery: "10–21 days",
            included: [
              "Compact scope workshop for goals, data, and roles",
              "MVP with one core workflow that removes friction",
              "Status or dashboard view for more transparency",
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
            title: "Website upgrade",
            description:
              "More speed, clearer UX, stronger CTAs, and more modern UI without a full rebuild.",
            fit: "Existing sites with a solid base but weaker clarity, UX, or performance.",
            price: "from €750 one-time",
            delivery: "3–10 days",
            included: [
              "Prioritized quick wins for speed, UX, and mobile clarity",
              "Targeted refresh for hierarchy, CTA, and reading flow",
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
            isComingSoon: true,
            description:
              "AI agents and skills as downloads for specific tasks.",
            comingSoonExamples: [
              "API setup with user login",
              "Agent for creating custom websites",
              "Specialized skills for specific use cases",
              "More focused setups and skills are planned",
            ],
          },
          {
            key: "maintenance",
            iconSrc: "/services/customer-service-icon.svg",
            iconAlt: "Maintenance and support icon",
            title: "Maintenance & support",
            description:
              "Fast iteration, bugfixes, and upkeep for existing websites or tools.",
            fit: "Existing sites or tools that need ongoing iteration instead of a full rebuild.",
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
        title: "Vom Scope bis Launch in vier klaren Schritten",
        description:
          "Der Ablauf ist so angelegt, dass du früh Orientierung bekommst, schnell eine erste Richtung siehst und vor dem Launch keine unklaren Übergaben hast.",
        summaryPoints: [
          "Ziel, Angebot und Scope früh geklärt",
          "erste Richtung schnell sichtbar",
          "Launch inkl. QA und sauberer Übergabe",
        ],
        processSteps: [
          {
            step: "01",
            title: "Ziel & Scope klären",
            deliverable: "Briefing + Angebotsempfehlung",
            effort: "Aufwand: ca. 30 Min",
            result: "Ergebnis: klarer Rahmen + Prioritäten",
            description:
              "Wir klären Ziel, Angebot, Material und Rahmen. Danach weißt du, welches Setup passt und was der nächste sinnvolle Schritt ist.",
          },
          {
            step: "02",
            title: "Struktur & erster Draft",
            deliverable: "Klickbarer Draft oder Prototyp",
            effort: "Lieferzeit: früh im Projekt sichtbar (je nach Umfang)",
            result: "Ergebnis: Seitenstruktur oder Kern-Workflow",
            description:
              "Ich setze eine erste klare Richtung um. Wo sinnvoll, beschleunige ich die Umsetzung mit Build-Workflows, ohne die Qualitätskontrolle abzugeben.",
          },
          {
            step: "03",
            title: "Umsetzung, Copy & QA",
            deliverable: "Ausgearbeitete Version",
            effort: "Feedback: 1-2 Runden",
            result: "Ergebnis: klare UX + saubere Details",
            description:
              "Ich schärfe Copy, CTA-Führung, Design und technische Details, damit die Seite oder das Tool nicht nur funktioniert, sondern klar führt.",
          },
          {
            step: "04",
            title: "Launch & Übergabe",
            deliverable: "Launch + Übergabe",
            effort: "QA: finaler Check",
            result: "Ergebnis: Livegang oder saubere Integration",
            description:
              "Nach dem finalen Check geht das Projekt live oder wird sauber an dein Setup übergeben, ohne offene Schleifen im Abschluss.",
          },
        ],
        processCta: {
          label: "Projekt & Scope anfragen",
          hint: "Unverbindlich. In der Regel Rückmeldung innerhalb von 24h.",
          href: "#contact",
        },
      },
      en: {
        title: "From scope to launch in four clear steps",
        description:
          "The flow is designed so you get orientation early, see the first direction quickly, and avoid fuzzy handoffs before launch.",
        summaryPoints: [
          "goal, offer, and scope clarified early",
          "first direction visible quickly",
          "launch includes QA and clean handover",
        ],
        processSteps: [
          {
            step: "01",
            title: "Clarify goal & scope",
            deliverable: "Briefing + offer recommendation",
            effort: "Effort: about 30 min",
            result: "Outcome: clear frame + priorities",
            description:
              "We align on goals, offer, materials, and boundaries so you know which setup fits and what the next sensible step is.",
          },
          {
            step: "02",
            title: "Structure & first draft",
            deliverable: "Clickable draft or prototype",
            effort: "Delivery: visible early in the project",
            result: "Outcome: page structure or core workflow",
            description:
              "I build a first clear direction. Where it helps, I use fast build workflows without handing off quality control.",
          },
          {
            step: "03",
            title: "Implementation, copy & QA",
            deliverable: "Worked-out version",
            effort: "Feedback: 1-2 rounds",
            result: "Outcome: clearer UX + clean details",
            description:
              "I refine copy, CTA flow, design, and technical details so the site or tool does not just work, but leads clearly.",
          },
          {
            step: "04",
            title: "Launch & handover",
            deliverable: "Launch + handover",
            effort: "QA: final check",
            result: "Outcome: go-live or clean integration",
            description:
              "After the final review, the project goes live or is handed over cleanly into your setup without loose ends.",
          },
        ],
        processCta: {
          label: "Request project & scope",
          hint: "No commitment. Typically a reply within 24h.",
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
              "Nach deiner Anfrage kläre ich Ziel, Umfang und Zeitrahmen in einem kurzen Call oder per E-Mail. Danach erhältst du eine klare Empfehlung zum passenden Angebot, den nächsten Schritt und ein transparentes Setup für die Umsetzung.",
          },
          {
            question: "Kannst du meine bestehende Website überarbeiten?",
            answer:
              "Ja. Ich kann bestehende Seiten gezielt modernisieren, technisch stabilisieren und für Conversion verbessern, ohne alles neu zu bauen. Falls ein kompletter Relaunch sinnvoller ist, sage ich das offen vorab.",
          },
          {
            question: "Welche Tools setzt du ein?",
            answer:
              "Ich arbeite mit einem modernen Web-Stack rund um Next.js, Tailwind und passenden Analyse- bzw. Automatisierungs-Tools. Schnelle Build-Workflows nutze ich dort, wo sie sinnvoll sind, die Verantwortung für Architektur, Review und QA bleibt aber bei mir.",
          },
          {
            question: "Gibt es versteckte Kosten?",
            answer:
              "Nein. Du erhältst vor Start ein klares Angebot mit definiertem Leistungsumfang. Zusätzliche Wünsche außerhalb des Leistungsumfangs stimme ich immer vor Umsetzung transparent mit dir ab.",
          },
          {
            question: "Was ist im Angebot typischerweise nicht enthalten?",
            answer:
              "Nicht enthalten sind in der Regel Hosting, Domain, externe Tool- oder Lizenzkosten sowie Integrationen, die nicht im vereinbarten Leistungsumfang stehen. Solche Punkte werden vor Umsetzung separat aufgeführt und abgestimmt.",
          },
          {
            question: "Wie viele Korrekturen sind enthalten?",
            answer:
              "Die enthaltenen Korrekturen hängen vom Paket ab. Bei Landingpages sind in der Regel 1–2 Feedbackrunden enthalten. Weitere Korrekturen oder zusätzliche Schleifen stimmen wir vorab transparent als Zusatzaufwand ab.",
          },
          {
            question: "Wie gehst du mit Zusatzwünschen um?",
            answer:
              "Zusatzwünsche außerhalb des vereinbarten Scopes werden nicht stillschweigend umgesetzt. Ich nenne dir vorab Auswirkung auf Aufwand, Timing und Preis und starte erst nach kurzer schriftlicher Freigabe per E-Mail.",
          },
          {
            question: "Welche Mitwirkung ist auf Kundenseite nötig?",
            answer:
              "Für einen sauberen Ablauf brauche ich zeitnahes Feedback, Freigaben, notwendige Zugänge und ggf. Inhalte/Assets. Verzögerungen bei diesen Mitwirkungen können den Zeitplan entsprechend verschieben.",
          },
          {
            question: "Wann gilt ein Projekt als abgeschlossen?",
            answer:
              "Ein Projekt gilt als abgeschlossen, wenn der vereinbarte Leistungsumfang geliefert und die Übergabe bzw. der Go-live erfolgt ist. Weitere Wünsche danach behandeln wir als Folgeauftrag, sofern es sich nicht um Abweichungen vom vereinbarten Umfang handelt.",
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
              "After your request, I align on goals, scope, and timeline in a short call or by email. You then get a clear recommendation on the right offer, the next step, and a transparent setup for delivery.",
          },
          {
            question: "Can you redesign my existing website?",
            answer:
              "Yes. I can modernize existing pages, improve technical stability, and optimize for conversion without rebuilding everything from scratch. If a full relaunch is the better option, I tell you upfront.",
          },
          {
            question: "Which tools do you use?",
            answer:
              "I work with a modern web stack around Next.js, Tailwind, and suitable analytics or automation tools. Where fast build workflows help, I use them, but architecture, review, and QA stay under my responsibility.",
          },
          {
            question: "Are there any hidden costs?",
            answer:
              "No. You receive a clear offer with a defined scope before implementation starts. Any additional requests outside scope are always aligned transparently before execution.",
          },
          {
            question: "What is typically not included in the offer?",
            answer:
              "What is usually not included: hosting, domain, external tool or license costs, and integrations outside the agreed scope. These items are listed and aligned separately before implementation.",
          },
          {
            question: "How many revision rounds are included?",
            answer:
              "Included revisions depend on the package. For landing pages, typically 1-2 feedback rounds are included. Any additional rounds are aligned transparently in advance as extra effort.",
          },
          {
            question: "How are additional requests handled?",
            answer:
              "Requests outside the agreed scope are not implemented silently. I first share the impact on effort, timeline, and price, and proceed only after short written confirmation by email.",
          },
          {
            question: "What client-side input is required?",
            answer:
              "A smooth process requires timely feedback, approvals, required access, and, where needed, content or assets. Delays in these inputs can shift the project timeline accordingly.",
          },
          {
            question: "When is a project considered completed?",
            answer:
              "A project is considered completed when the agreed scope has been delivered and handover or go-live has taken place. Requests beyond that are handled as follow-up work unless they concern deviations from the agreed scope.",
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
          "In der Regel Rückmeldung innerhalb von 24h",
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
          label: "Angebote ansehen",
          href: "#services",
        },
        footerColumns: [
          {
            title: "Menü",
            links: [
              { label: "Was du bekommst", href: "#included" },
              { label: "Angebote & Preise", href: "#services" },
              { label: "Prozess", href: "#process" },
              { label: "Q&A", href: "#faq" },
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
        footerCopyright: "© 2026 Invessiv. Alle Rechte vorbehalten.",
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
            detailPoints: [
              "Antwort in der Regel innerhalb von 24h",
              "Kein Termin nötig",
            ],
            metaLabel: "E-Mail",
            metaValue: "Asynchroner Schnellkontakt",
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
          label: "Angebote vergleichen",
          href: "#services",
          hint: "",
        },
        contactForm: {
          title: "Projektanfrage für konkrete Vorhaben",
          subtitle: "Für Vorhaben mit klarer Richtung und Startbereitschaft.",
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
          pagesPlaceholder: "z. B. Team, FAQ, Karriere",
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
          pagesCustomPlaceholder: "z. B. Team, FAQ, Karriere",
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
          "Typically a reply within 24h",
          "Direct contact without sales handoff",
        ],
        footerHeroTitle: "Ready for a new, productive website?",
        footerHeroDescription:
          "Contact me and start your project with Invessiv.",
        footerHeroPrimaryCta: { label: "Start project now", href: "#contact" },
        footerHeroSecondaryCta: { label: "View offers", href: "#services" },
        footerColumns: [
          {
            title: "Menu",
            links: [
              { label: "What you get", href: "#included" },
              { label: "Offers & pricing", href: "#services" },
              { label: "Process", href: "#process" },
              { label: "Q&A", href: "#faq" },
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
        footerCopyright: "© 2026 Invessiv. All rights reserved.",
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
          {
            mode: "email",
            kicker: "Async & low effort",
            label: "Short email",
            description:
              "Best for fast async contact when you want to clarify the next step in writing.",
            value: COMPANY.contact.email,
            href: COMPANY_MAILTO,
            helper:
              "2-4 lines are enough: goal, context, and what you need next.",
            hint: "You get a clear assessment and a concrete next step.",
            actionLabel: "Send email",
            copyValue: COMPANY.contact.email,
            copyLabel: "Copy address",
            copiedLabel: "Address copied",
            detailPoints: [
              "Typically a reply within 24h",
              "No scheduling needed",
            ],
            metaLabel: "Email",
            metaValue: "Asynchronous quick contact",
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
          label: "Compare offers",
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
          pagesPlaceholder: "e.g. Team, FAQ, Careers",
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
          pagesCustomPlaceholder: "e.g. Team, FAQ, Careers",
          pagesRequiredHint: "Please select at least one page or add your own.",
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
          label: "Angebote ansehen",
          href: "#services",
        },
        footerColumns: [
          {
            title: "Menü",
            links: [
              { label: "Was du bekommst", href: "#included" },
              { label: "Angebote & Preise", href: "#services" },
              { label: "Prozess", href: "#process" },
              { label: "Q&A", href: "#faq" },
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
        footerCopyright: "© 2026 Invessiv. Alle Rechte vorbehalten.",
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
        footerHeroSecondaryCta: { label: "View offers", href: "#services" },
        footerColumns: [
          {
            title: "Menu",
            links: [
              { label: "What you get", href: "#included" },
              { label: "Offers & pricing", href: "#services" },
              { label: "Process", href: "#process" },
              { label: "Q&A", href: "#faq" },
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
        footerCopyright: "© 2026 Invessiv. All rights reserved.",
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
