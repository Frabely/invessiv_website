import { SECTION_HREFS, type SectionId } from "@/config/site";
import type { Locale } from "@/config/i18n";
import {
  COMPANY,
  COMPANY_CALENDLY,
  COMPANY_MAILTO,
  COMPANY_SOCIAL_INSTAGRAM,
  COMPANY_SOCIAL_LINKEDIN,
  COMPANY_TEL,
} from "@/config/company";
import { CONTACT_BUDGET_KEY } from "@/common/constants/contact/contact-budget-keys";
import { CONTACT_GOAL_KEY } from "@/common/constants/contact/contact-goal-keys";
import { CONTACT_PAGE_KEY } from "@/common/constants/contact/contact-page-keys";
import { CONTACT_START_KEY } from "@/common/constants/contact/contact-start-keys";
import { CONTACT_WORKFLOW_KEY } from "@/common/constants/contact/contact-workflow-keys";

type ServiceCardKey = "landing" | "process" | "web" | "upgrade" | "maintenance";

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
  highlight: string;
  pricingHint: string;
  delivery: string;
  deliveryLabel?: string;
  included: string[];
  details?: string[];
};

type ContactFormOption = {
  key: string;
  label: string;
};

type ProofReview = {
  authorName: string;
  context: string;
  excerpt: string;
  profileImageSrc?: string;
  reviewHref: string;
  sourceLabel: string;
};

type ProofFeaturedProject = {
  ariaLabel: string;
  kicker: string;
  title: string;
  description: string;
  meta: string;
};

type ProofMoreProjects = {
  ctaLabel: string;
  description: string;
  href: string;
  title: string;
};

const GOOGLE_REVIEW_PLACEHOLDER_URL = "https://www.google.com";

export type LandingSectionCopy = {
  title: string;
  description: string;
  summaryPoints?: string[];
  proofRatingAriaLabel?: string;
  proofReviewLinkLabel?: string;
  proofReviews?: ProofReview[];
  proofFeaturedProject?: ProofFeaturedProject;
  proofMoreProjects?: ProofMoreProjects;
  serviceCards?: StandardServiceCard[];
  serviceSecondaryTitle?: string;
  serviceContextNote?: string;
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
  contactCta?: {
    kicker?: string;
    label: string;
    href: string;
    description?: string;
    hint?: string;
  };
  contactSecondaryCta?: {
    label: string;
    href: string;
  };
  contactForm?: {
    title: string;
    subtitle: string;
    intro: string;
    conditionalFieldHint: string;
    firstNameLabel: string;
    lastNameLabel: string;
    emailLabel: string;
    addPageLabel: string;
    phoneLabel: string;
    companyLabel: string;
    roleLabel: string;
    websiteLabel: string;
    offerLabel: string;
    offerPlaceholder: string;
    goalLabel: string;
    goalOptions: ContactFormOption[];
    pagesLabel: string;
    pagesPlaceholder: string;
    pagesOptions?: ContactFormOption[];
    pagesCustomLabel?: string;
    pagesCustomPlaceholder?: string;
    pagesCustomRemoveLabel?: string;
    pagesRequiredHint?: string;
    workflowLabel: string;
    workflowOptions: ContactFormOption[];
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
    budgetOptions: ContactFormOption[];
    startLabel: string;
    startOptions: ContactFormOption[];
    projectDetailsLabel: string;
    projectDetailsPlaceholder: string;
    consentLabel: string;
    privacyLabel: string;
    submitLabel: string;
    submittingLabel: string;
    submitSuccess: string;
    submitErrorValidation: string;
    submitErrorRateLimited: string;
    submitErrorDelivery: string;
    submitErrorGeneric: string;
    validationSummaryPrefix: string;
    fieldErrorInvalidEmail: string;
    fieldErrorInvalidWebsite: string;
    fieldErrorRequired: string;
    fieldErrorProjectDetailsRequired: string;
    fieldErrorPagesRequired: string;
    fieldErrorTooManyPages: string;
    fieldErrorGoalRequired: string;
    fieldErrorWorkflowRequired: string;
    fieldErrorConsentRequired: string;
    requiredHint: string;
    closeLabel?: string;
  };
  quickContactForm?: {
    title: string;
    subtitle: string;
    intro: string;
    metaLabel: string;
    firstNameLabel: string;
    lastNameLabel: string;
    emailLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    consentLabel: string;
    privacyLabel: string;
    submitLabel: string;
    submittingLabel: string;
    submitSuccess: string;
    submitErrorRateLimited: string;
    submitErrorDelivery: string;
    submitErrorGeneric: string;
    fieldErrorInvalidEmail: string;
    fieldErrorRequired: string;
    fieldErrorConsentRequired: string;
    requiredHint: string;
  };
  discoveryCallForm?: {
    title: string;
    subtitle: string;
    intro: string;
    firstNameLabel: string;
    lastNameLabel: string;
    emailLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    consentLabel: string;
    privacyLabel: string;
    submitLabel: string;
    submittingLabel: string;
    submitSuccess: string;
    submitErrorRateLimited: string;
    submitErrorGeneric: string;
    fieldErrorInvalidEmail: string;
    fieldErrorRequired: string;
    fieldErrorConsentRequired: string;
    requiredHint: string;
  };
  footerColumns?: Array<{
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }>;
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
        title: "Webseiten,\ndie führen.\nTools,\ndie entlasten.",
        description:
          "Für Unternehmen, die online klarer auftreten, schneller live gehen und intern weniger manuell nacharbeiten wollen.",
      },
      en: {
        title: "Websites,\nthat lead.\nTools,\nthat lighten the load.",
        description:
          "From landing page to process tool: with a clean setup, direct feedback, and a result that is reviewed before launch.",
      },
    },
  },
  {
    id: "included",
    copy: {
      de: {
        title: "Vom ersten Rahmen bis zur Übergabe",
        description:
          "Nach der Anfrage weißt du, welcher Einstieg sinnvoll ist und wie es konkret weitergeht.",
        summaryPoints: [
          "Empfehlung vor Start",
          "kurze Abstimmung",
          "QA & Übergabe",
        ],
      },
      en: {
        title: "From first outline to handoff",
        description:
          "After the inquiry, you know which entry point makes sense and how the next step looks.",
        summaryPoints: [
          "recommendation before kickoff",
          "short feedback loops",
          "QA & handover",
        ],
      },
    },
  },
  {
    id: "proof",
    copy: {
      de: {
        title: "Was Kunden über die Zusammenarbeit sagen",
        description: "aus realen Web- & Softwareprojekten",
        summaryPoints: [
          "5,0 ★★★★★ bei Google",
          "echte Kundenstimmen",
          "klare Ergebnisse",
        ],
        proofRatingAriaLabel: "5 von 5 Sternen",
        proofReviewLinkLabel: "Bei Google ansehen",
        proofFeaturedProject: {
          ariaLabel: "Umgesetztes Projekt für Kolja Wienigk",
          kicker: "Umgesetztes Projekt",
          title:
            "Neue Webseite für einen Finanzmakler mit klarer Positionierung",
          description:
            "Das ist das konkret umgesetzte Projekt für Kolja: ein ruhiger, vertrauenswürdiger Auftritt mit klarer Angebotsstruktur, sauberer Führung und einer Startseite, die Leistungen direkt verständlich macht.",
          meta: "Umgesetzt für Kolja Wienigk",
        },
        proofMoreProjects: {
          title: "Projektübersicht",
          description:
            "In der Projektübersicht findest du aktuell noch ein weiteres umgesetztes Beispiel.",
          ctaLabel: "Projektübersicht öffnen",
          href: "/de/projects",
        },
        proofReviews: [
          {
            authorName: "Kolja Wienigk",
            context: "Finanzmakler aus Dresden",
            excerpt:
              "Vom ersten Gespräch an war klar, welche Schritte sinnvoll sind und worauf wir zuerst den Fokus legen sollten. Die Umsetzung wirkte strukturiert, schnell und ohne unnötige Schleifen.",
            profileImageSrc: "/assets/kolja.png",
            reviewHref: GOOGLE_REVIEW_PLACEHOLDER_URL,
            sourceLabel: "Google Bewertung",
          },
          {
            authorName: "Andreas H.",
            context: "Chemnitz",
            excerpt:
              "Besonders hilfreich war die klare Kommunikation im Projekt. Entscheidungen wurden sauber vorbereitet, Feedback schnell umgesetzt und das Ergebnis hat deutlich professioneller gewirkt als vorher.",
            reviewHref: GOOGLE_REVIEW_PLACEHOLDER_URL,
            sourceLabel: "Google Bewertung",
          },
        ],
      },
      en: {
        title: "What clients say about working together",
        description: "from real web and software projects",
        summaryPoints: [
          "5.0 ★★★★★ on Google",
          "real client reviews",
          "clear outcomes",
        ],
        proofRatingAriaLabel: "5 out of 5 stars",
        proofReviewLinkLabel: "View on Google",
        proofFeaturedProject: {
          ariaLabel: "Delivered project for Kolja Wienigk",
          kicker: "Delivered project",
          title: "New website for a financial broker with clear positioning",
          description:
            "This is the project delivered for Kolja: a calm, trustworthy presence with a clear offer structure, guided flow, and a homepage that makes the services easy to understand right away.",
          meta: "Delivered for Kolja Wienigk",
        },
        proofMoreProjects: {
          title: "Project overview",
          description:
            "In the project overview, there is currently one more delivered example.",
          ctaLabel: "Open project overview",
          href: "/en/projects",
        },
        proofReviews: [
          {
            authorName: "Kolja Wienigk",
            context: "Financial broker from Dresden",
            excerpt:
              "From the first conversation onward, it was clear which steps made sense and what should be prioritised first. The delivery felt structured, fast, and free of unnecessary loops.",
            profileImageSrc: "/assets/kolja.png",
            reviewHref: GOOGLE_REVIEW_PLACEHOLDER_URL,
            sourceLabel: "Google review",
          },
          {
            authorName: "Andreas H.",
            context: "Chemnitz",
            excerpt:
              "The clearest strength was the communication throughout the project. Decisions were prepared well, feedback moved quickly, and the final result felt significantly more professional than before.",
            reviewHref: GOOGLE_REVIEW_PLACEHOLDER_URL,
            sourceLabel: "Google review",
          },
        ],
      },
    },
  },
  {
    id: "services",
    copy: {
      de: {
        title: "Was brauchst du gerade?",
        description:
          "Fünf typische Leistungsmodelle zur Orientierung – je nachdem, ob du Anfragen klarer führen, deinen Auftritt neu aufsetzen oder interne Abläufe vereinfachen willst. Umfang, Timing und Vergütung klären wir vor Start individuell.",
        summaryPoints: [
          "klarer Einstieg je Problem",
          "Umfang vor Start verbindlich",
          "Lieferfenster und typische Projektumfänge sichtbar",
        ],
        serviceContextNote:
          "Alle Projekte werden individuell kalkuliert. Du erhältst vor Start ein verbindliches Angebot in Textform.",
        serviceSecondaryTitle:
          "Schon etwas da? Oder brauchst du Unterstützung danach?",
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
            highlight: "schnell live & conversion-fokussiert",
            pricingHint: "Angebot nach Ziel, Umfang und Feedbackbedarf",
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
              "Hosting, Domain und externe Tool-Lizenzen werden bei Bedarf separat abgestimmt.",
            ],
          },
          {
            key: "web",
            iconSrc: "/services/coding-icon.svg",
            iconAlt: "Webseiten Icon",
            title: "Webseiten",
            description:
              "Webseiten-Relaunch oder Unternehmensseite mit besserer Positionierung und klareren Nutzerwegen.",
            fit: "Relaunches oder Unternehmensseiten mit mehreren Kernseiten und klarer Lead-Zielsetzung.",
            highlight: "klarer professioneller Auftritt",
            pricingHint: "Individuelles Angebot nach Seitenumfang und Tiefe",
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
              "Drittanbieter-Lizenzen und externe Integrationen werden bei Bedarf separat abgestimmt.",
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
            highlight: "weniger manuelle Schritte im Alltag",
            pricingHint: "Kalkulation nach Workflow, Daten und Integrationen",
            delivery: "10–21 Tage",
            included: [
              "Kompakter Rahmen-Workshop zu Ziel, Daten und Rollen",
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
            iconAlt: "Webseiten-Upgrade Icon",
            title: "Webseiten-Upgrade",
            description:
              "Mehr Speed, bessere UX, klarere CTAs und moderneres UI ohne kompletten Neubau.",
            fit: "Bestehende Seiten mit gutem Kern, aber schwächerer Klarheit, UX oder Performance.",
            highlight: "spürbare UX- und Speed-Verbesserung",
            pricingHint: "Angebot nach Ist-Zustand und Eingriffstiefe",
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
              "Optional auch als laufende Weiterentwicklung oder gezielte Einzelleistung planbar.",
              "Größere Rebuild-Themen werden separat empfohlen und geplant.",
              "Tiefe Backend-Refactorings sind nicht im Basis-Upgrade enthalten.",
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
            highlight: "schnelle Hilfe für laufende Themen",
            pricingHint: "Nach Aufwand oder abgestimmtem Betreuungspaket",
            delivery: "24–72h",
            deliveryLabel: "Typische Reaktionszeit",
            included: [
              "Content- und Kleinpflege nach abgestimmtem Umfang",
              "Entwicklung und Implementierung nach Aufwand oder Vereinbarung",
              "Auf Wunsch regelmäßige Monitoring- und Qualitätschecks",
              "Wichtige Themen zuerst (nach Business-Impact)",
              "Transparente Betreuungspakete oder Einzelabruf nach Bedarf",
            ],
            details: [
              "Du zahlst nur den abgestimmten oder tatsächlich erfassten Aufwand mit klarer Aufstellung.",
              "Notfallanfragen priorisiere ich nach Verfügbarkeit.",
            ],
          },
        ],
      },
      en: {
        title: "What do you need right now?",
        description:
          "Five typical service models for orientation, depending on whether you want to guide inquiries more clearly, rebuild your presence, or simplify internal workflows. Scope, timing, and pricing are aligned individually before kickoff.",
        summaryPoints: [
          "clear entry point per problem",
          "service range aligned before kickoff",
          "delivery window and typical project scope visible",
        ],
        serviceContextNote:
          "Every project is calculated individually. You receive a binding written offer before delivery starts.",
        serviceSecondaryTitle:
          "Already have something in place? Or need support afterward?",
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
            highlight: "live quickly and tuned for conversion",
            pricingHint: "Quote based on goal, scope, and feedback depth",
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
              "From the 3rd feedback round onward, additional effort is outlined transparently.",
              "Hosting, domain, and external tool licenses are aligned separately when needed.",
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
            highlight: "a clearer professional presence",
            pricingHint: "Individual quote based on page scope and depth",
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
              "Additional pages and multilingual rollout are planned upfront.",
              "Third-party licenses and external integrations are aligned separately when needed.",
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
            highlight: "fewer manual steps in daily work",
            pricingHint: "Calculated by workflow, data, and integrations",
            delivery: "10–21 days",
            included: [
              "Compact planning workshop for goals, data, and roles",
              "MVP with one core workflow that removes friction",
              "Status or dashboard view for more transparency",
              "Integrations by project range (webhooks, APIs)",
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
            highlight: "noticeable UX and speed gains",
            pricingHint:
              "Quote based on the current state and depth of intervention",
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
              "Can also be planned as ongoing iteration or as a focused one-off improvement.",
              "Larger rebuild topics are recommended and planned separately.",
              "Deep backend refactoring is not included in the base upgrade.",
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
            highlight: "fast help for ongoing priorities",
            pricingHint: "By effort or an agreed support retainer",
            delivery: "24–72h",
            deliveryLabel: "Typical response time",
            included: [
              "Content and minor updates within an agreed scope",
              "Development and implementation by effort or agreement",
              "Optional recurring monitoring and quality checks",
              "High-impact topics first (by business impact)",
              "Transparent retainers or ad-hoc support when needed",
            ],
            details: [
              "You only pay for the agreed or actually logged effort with a clear breakdown.",
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
        title: "Vom ersten Rahmen bis zum Launch in vier klaren Schritten",
        description:
          "Der Ablauf ist so angelegt, dass du früh Orientierung bekommst, schnell eine erste Richtung siehst und vor dem Launch keine unklaren Übergaben hast.",
        summaryPoints: [
          "Ziel, Angebot und Umfang früh geklärt",
          "erste Richtung schnell sichtbar",
          "Launch inkl. QA und sauberer Übergabe",
        ],
        processSteps: [
          {
            step: "01",
            title: "Ziel & Rahmen klären",
            deliverable: "Briefing + Angebotsempfehlung",
            effort: "Aufwand: ca. 30 Min",
            result: "Ergebnis: klarer Rahmen + Prioritäten",
            description:
              "Wir klären Ziel, Material und Rahmen. Danach bekommst du eine klare Empfehlung und ein passendes Angebot.",
          },
          {
            step: "02",
            title: "Struktur & erster Draft",
            deliverable: "Klickbarer Draft oder Prototyp",
            effort: "Lieferzeit: früh im Projekt sichtbar (je nach Umfang)",
            result: "Ergebnis: Seitenstruktur oder Kern-Workflow",
            description:
              "Ich entwickle die Struktur, Seitenlogik oder den ersten Prototypen. So ist früh sichtbar, wie das Projekt aufgebaut wird.",
          },
          {
            step: "03",
            title: "Umsetzung, Copy & QA",
            deliverable: "Ausgearbeitete Version",
            effort: "Feedback: 1-2 Runden",
            result: "Ergebnis: klare UX + saubere Details",
            description:
              "Danach folgt die Umsetzung mit den nötigen Inhalten, Details und QA-Schritten bis zur sauberen Freigabe.",
          },
          {
            step: "04",
            title: "Launch & Übergabe",
            deliverable: "Launch + Übergabe",
            effort: "QA: finaler Check",
            result: "Ergebnis: Livegang oder saubere Integration",
            description:
              "Zum Schluss geht das Projekt live oder wird sauber übergeben – inklusive der nächsten sinnvollen Schritte nach dem Launch.",
          },
        ],
        processCta: {
          label: "Projekt & Umfang anfragen",
          href: SECTION_HREFS.contact,
        },
      },
      en: {
        title: "From first outline to launch in four clear steps",
        description:
          "The flow is designed so you get orientation early, see the first direction quickly, and avoid fuzzy handoffs before launch.",
        summaryPoints: [
          "goal, offer, and project range clarified early",
          "first direction visible quickly",
          "launch includes QA and clean handover",
        ],
        processSteps: [
          {
            step: "01",
            title: "Clarify goal & outline",
            deliverable: "Briefing + offer recommendation",
            effort: "Effort: about 30 min",
            result: "Outcome: clear frame + priorities",
            description:
              "We align on the goal, materials, and project frame. After that, you get a clear recommendation and a fitting offer.",
          },
          {
            step: "02",
            title: "Structure & first draft",
            deliverable: "Clickable draft or prototype",
            effort: "Delivery: visible early in the project",
            result: "Outcome: page structure or core workflow",
            description:
              "I develop the structure, page logic, or the first prototype. That makes the project setup visible early.",
          },
          {
            step: "03",
            title: "Implementation, copy & QA",
            deliverable: "Worked-out version",
            effort: "Feedback: 1-2 rounds",
            result: "Outcome: clearer UX + clean details",
            description:
              "Then comes the implementation with the required content, details, and QA steps through to a clean approval.",
          },
          {
            step: "04",
            title: "Launch & handover",
            deliverable: "Launch + handover",
            effort: "QA: final check",
            result: "Outcome: go-live or clean integration",
            description:
              "In the end, the project goes live or is handed over cleanly, including the next sensible steps after launch.",
          },
        ],
        processCta: {
          label: "Request project & outline",
          href: SECTION_HREFS.contact,
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
              "Nach deiner Anfrage kläre ich Ziel, Umfang und Zeitrahmen in einem kurzen Call oder per E-Mail. Danach erhältst du eine klare Empfehlung zum passenden Leistungsmodell, den nächsten Schritt und bei Bedarf ein individuelles Angebot für die Umsetzung.",
          },
          {
            question: "Kannst du meine bestehende Webseite überarbeiten?",
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
              "Die enthaltenen Korrekturen hängen vom gewählten Leistungsmodell ab. Bei Landingpages sind in der Regel 1–2 Feedbackrunden enthalten. Weitere Korrekturen oder zusätzliche Schleifen stimmen wir vorab transparent als Zusatzaufwand ab.",
          },
          {
            question: "Wie gehst du mit Zusatzwünschen um?",
            answer:
              "Zusatzwünsche außerhalb des vereinbarten Rahmens werden nicht stillschweigend umgesetzt. Ich nenne dir vorab die Auswirkungen auf Aufwand, Timing und Preis und starte erst nach kurzer schriftlicher Freigabe per E-Mail.",
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
              "After your request, I align on goals, project range, and timeline in a short call or by email. You then get a clear recommendation on the right service model, the next step, and, where useful, an individual offer for delivery.",
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
              "No. You receive a clear offer with a defined delivery frame before implementation starts. Any additional requests outside that frame are always aligned transparently before execution.",
          },
          {
            question: "What is typically not included in the offer?",
            answer:
              "What is usually not included: hosting, domain, external tool or license costs, and integrations outside the agreed project range. These items are listed and aligned separately before implementation.",
          },
          {
            question: "How many revision rounds are included?",
            answer:
              "Included revisions depend on the selected service model. For landing pages, typically 1-2 feedback rounds are included. Any additional rounds are aligned transparently in advance as extra effort.",
          },
          {
            question: "How are additional requests handled?",
            answer:
              "Requests outside the agreed frame are not implemented silently. I first share the impact on effort, timeline, and price, and proceed only after short written confirmation by email.",
          },
          {
            question: "What client-side input is required?",
            answer:
              "A smooth process requires timely feedback, approvals, required access, and, where needed, content or assets. Delays in these inputs can shift the project timeline accordingly.",
          },
          {
            question: "When is a project considered completed?",
            answer:
              "A project is considered completed when the agreed service range has been delivered and handover or go-live has taken place. Requests beyond that are handled as follow-up work unless they concern deviations from the agreed basis.",
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
        contactDecisionIntro:
          "Wähle den Einstieg, der jetzt passt: Projektanfrage, kurze E-Mail oder ein 15-20-Minuten-Kennenlerntermin.",
        contactChannels: [
          {
            mode: "call",
            kicker: "Synchron abstimmen",
            label: "Kennenlern-Call",
            description:
              "Für direkte Abstimmung, wenn Umfang und Aufwand im Termin geklärt werden sollen.",
            value: "15-20 Minuten Abstimmung",
            href: COMPANY_CALENDLY,
            actionLabel: "Termin auswählen",
            detailPoints: [
              "15-20 Minuten fokussiert",
              "Umfang und Aufwand grob einordnen",
              "Konkreter nächster Schritt danach",
            ],
          },
          {
            mode: "email",
            kicker: "Asynchron & schnell",
            label: "Kurze E-Mail",
            description:
              "Für schnellen Erstkontakt, wenn du den nächsten Schritt kurz per Text klären willst.",
            value: COMPANY.contact.email,
            href: COMPANY_MAILTO,
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
        contactCta: {
          kicker: "Direkt starten",
          label: "Projektanfrage starten",
          href: SECTION_HREFS.contact,
        },
        contactSecondaryCta: {
          label: "Leistungsmodelle vergleichen",
          href: SECTION_HREFS.services,
        },
        contactForm: {
          title: "Projektanfrage für konkrete Vorhaben",
          subtitle: "Für Vorhaben mit klarer Richtung und Startbereitschaft.",
          intro:
            "Du gibst die wichtigsten Eckdaten an, ich antworte mit einem klaren Vorschlag zu Umfang, Timing und Budgetrahmen.",
          conditionalFieldHint:
            "Je nach gewähltem Leistungsmodell zeige ich nur die wirklich relevanten Felder.",
          firstNameLabel: "Vorname",
          lastNameLabel: "Nachname",
          emailLabel: "E-Mail",
          addPageLabel: "Seite hinzufügen",
          phoneLabel: "Telefon",
          companyLabel: "Unternehmen",
          roleLabel: "Rolle",
          websiteLabel: "Aktuelle Webseite",
          offerLabel: "Passendes Leistungsmodell",
          offerPlaceholder: "Bitte Leistungsmodell wählen",
          goalLabel: "Hauptziel der Landingpage",
          goalOptions: [
            {
              key: CONTACT_GOAL_KEY.GenerateInquiries,
              label: "Anfragen gewinnen",
            },
            {
              key: CONTACT_GOAL_KEY.IncreaseBookings,
              label: "Termine buchen lassen",
            },
            { key: CONTACT_GOAL_KEY.SellProduct, label: "Produkt verkaufen" },
            {
              key: CONTACT_GOAL_KEY.GrowNewsletter,
              label: "Kontakte aufbauen",
            },
            { key: CONTACT_GOAL_KEY.OtherGoal, label: "Anderes Ziel" },
          ],
          pagesLabel: "Benötigte Seiten",
          pagesPlaceholder: "z. B. Team, FAQ, Karriere",
          pagesOptions: [
            { key: CONTACT_PAGE_KEY.Home, label: "Start" },
            { key: CONTACT_PAGE_KEY.Services, label: "Leistungen" },
            { key: CONTACT_PAGE_KEY.About, label: "Über uns" },
            { key: CONTACT_PAGE_KEY.Contact, label: "Kontakt" },
            { key: CONTACT_PAGE_KEY.Careers, label: "Karriere" },
            { key: CONTACT_PAGE_KEY.Blog, label: "Blog" },
            { key: CONTACT_PAGE_KEY.LandingPage, label: "Landingpage" },
          ],
          pagesCustomLabel: "Weitere Seite hinzufügen",
          pagesCustomPlaceholder: "z. B. Sponsoren",
          pagesCustomRemoveLabel: "Seite entfernen",
          pagesRequiredHint:
            "Bitte wähle mindestens eine Seite oder ergänze eine eigene.",
          workflowLabel: "Art des Vorhabens",
          workflowOptions: [
            {
              key: CONTACT_WORKFLOW_KEY.DigitizeExistingProcess,
              label: "Bestehenden Ablauf digitalisieren",
            },
            {
              key: CONTACT_WORKFLOW_KEY.SimplifyManualProcess,
              label: "Manuellen Prozess vereinfachen",
            },
            {
              key: CONTACT_WORKFLOW_KEY.ConnectDataOrSystems,
              label: "Daten oder Systeme verbinden",
            },
            {
              key: CONTACT_WORKFLOW_KEY.BuildInternalTool,
              label: "Internes Tool für ein Team bauen",
            },
            {
              key: CONTACT_WORKFLOW_KEY.ImproveExistingTool,
              label: "Bestehendes Tool oder System verbessern",
            },
            {
              key: CONTACT_WORKFLOW_KEY.OtherProcess,
              label: "Anderes Vorhaben",
            },
          ],
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
            { key: CONTACT_BUDGET_KEY.Below1000, label: "Unter 1.000 €" },
            {
              key: CONTACT_BUDGET_KEY.Between1000And2500,
              label: "1.000 € - 2.500 €",
            },
            {
              key: CONTACT_BUDGET_KEY.Between2500And5000,
              label: "2.500 € - 5.000 €",
            },
            {
              key: CONTACT_BUDGET_KEY.Between5000And10000,
              label: "5.000 € - 10.000 €",
            },
            { key: CONTACT_BUDGET_KEY.Above10000, label: "10.000 €+" },
            { key: CONTACT_BUDGET_KEY.Open, label: "Noch offen" },
          ],
          startLabel: "Gewünschter Start",
          startOptions: [
            { key: CONTACT_START_KEY.Immediately, label: "Sofort" },
            {
              key: CONTACT_START_KEY.WithinTwoWeeks,
              label: "Innerhalb von 2 Wochen",
            },
            {
              key: CONTACT_START_KEY.WithinOneMonth,
              label: "Innerhalb von 1 Monat",
            },
            {
              key: CONTACT_START_KEY.LaterFlexible,
              label: "Später / flexibel",
            },
          ],
          projectDetailsLabel: "Projektziel und Anforderungen",
          projectDetailsPlaceholder:
            "Beschreibe Ziel, Zielgruppe, Deadline, wichtige Seiten/Features und vorhandene Assets.",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemäß",
          privacyLabel: "Datenschutzerklärung zu.",
          submitLabel: "Anfrage senden",
          submittingLabel: "Anfrage wird gesendet …",
          submitSuccess: "Danke. Deine Anfrage wurde erfolgreich gesendet.",
          submitErrorValidation:
            "Die Anfrage konnte nicht gesendet werden. Bitte prüfe deine Angaben.",
          submitErrorRateLimited:
            "Zu viele Anfragen in kurzer Zeit. Bitte versuche es gleich noch einmal.",
          submitErrorDelivery:
            "Die Anfrage konnte gerade nicht zugestellt werden. Nutze alternativ die E-Mail im Kontaktbereich.",
          submitErrorGeneric:
            "Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es erneut.",
          validationSummaryPrefix: "Bitte korrigiere dieses Feld",
          fieldErrorInvalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
          fieldErrorInvalidWebsite:
            "Bitte gib eine gültige Webseiten-URL ein, z. B. https://www.webseite.com. www.webseite.com ist ohne Protokoll ungültig.",
          fieldErrorRequired: "Dieses Feld ist erforderlich.",
          fieldErrorProjectDetailsRequired:
            "Bitte gib eine kurze Projektbeschreibung ein.",
          fieldErrorPagesRequired:
            "Bitte wähle mindestens eine Seite oder ergänze eine eigene.",
          fieldErrorTooManyPages: "Bitte füge maximal 12 eigene Seiten hinzu.",
          fieldErrorGoalRequired: "Bitte wähle ein Ziel für die Landingpage.",
          fieldErrorWorkflowRequired: "Bitte wähle die Art des Vorhabens.",
          fieldErrorConsentRequired:
            "Bitte bestätige die Datenschutzerklärung.",
          requiredHint: "* Pflichtfelder",
          closeLabel: "Formular schließen",
        },
        quickContactForm: {
          title: "Kurze E-Mail für den nächsten Schritt",
          subtitle: "Für schnellen Erstkontakt ohne komplettes Briefing.",
          intro: "Kurz reicht: Ziel, Kontext und was du als Nächstes brauchst.",
          metaLabel: "E-Mail",
          firstNameLabel: "Vorname",
          lastNameLabel: "Nachname",
          emailLabel: "E-Mail",
          messageLabel: "Nachricht",
          messagePlaceholder:
            "2-4 Sätze genügen: Worum geht es, was ist der Kontext, und was brauchst du als Nächstes?",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemäß",
          privacyLabel: "Datenschutzerklärung zu.",
          submitLabel: "E-Mail senden",
          submittingLabel: "Wird gesendet ...",
          submitSuccess: "Deine Anfrage wurde gesendet.",
          submitErrorRateLimited:
            "Zu viele Anfragen in kurzer Zeit. Bitte versuche es gleich noch einmal.",
          submitErrorDelivery:
            "Die Nachricht konnte gerade nicht zugestellt werden. Bitte versuche es später erneut.",
          submitErrorGeneric:
            "Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es später erneut.",
          fieldErrorInvalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
          fieldErrorRequired: "Dieses Feld ist erforderlich.",
          fieldErrorConsentRequired:
            "Bitte bestätige die Datenschutzerklärung.",
          requiredHint: "* Pflichtfelder",
        },
        discoveryCallForm: {
          title: "Kennenlerncall mit kurzer Vorbereitung",
          subtitle: "Für direkte Abstimmung mit etwas Kontext vor dem Termin.",
          intro:
            "Trag kurz deine Kontaktdaten ein und gib optional dein Anliegen mit, damit der Termin fokussierter starten kann.",
          firstNameLabel: "Vorname",
          lastNameLabel: "Nachname",
          emailLabel: "E-Mail",
          messageLabel: "Anliegen",
          messagePlaceholder:
            "Optional: Worum geht es grob, was soll im Termin geklärt werden?",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemäß",
          privacyLabel: "Datenschutzerklärung zu.",
          submitLabel: "Termin wählen",
          submittingLabel: "Terminübersicht wird geöffnet ...",
          submitSuccess:
            "Die Terminübersicht wird mit deinen Angaben geöffnet.",
          submitErrorRateLimited:
            "Zu viele Anfragen in kurzer Zeit. Bitte versuche es gleich noch einmal.",
          submitErrorGeneric:
            "Die Terminübersicht konnte gerade nicht geöffnet werden. Bitte versuche es später erneut.",
          fieldErrorInvalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
          fieldErrorRequired: "Dieses Feld ist erforderlich.",
          fieldErrorConsentRequired:
            "Bitte bestätige die Datenschutzerklärung.",
          requiredHint: "* Pflichtfelder",
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
        contactDecisionIntro:
          "Pick the path that fits now: project request, short email, or a focused 15-20 minute call.",
        contactChannels: [
          {
            mode: "call",
            kicker: "Sync alignment",
            label: "Discovery call",
            description:
              "Best for live alignment when project range and effort need quick discussion.",
            value: "15-20 minute alignment call",
            href: COMPANY_CALENDLY,
            actionLabel: "Choose a time",
            detailPoints: [
              "15-20 minutes focused",
              "Roughly map range & effort",
              "Leave with a concrete next step",
            ],
          },
          {
            mode: "email",
            kicker: "Async & low effort",
            label: "Short email",
            description:
              "Best for fast async contact when you want to clarify the next step in writing.",
            value: COMPANY.contact.email,
            href: COMPANY_MAILTO,
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
        contactCta: {
          kicker: "Start directly",
          label: "Start project request",
          href: SECTION_HREFS.contact,
        },
        contactSecondaryCta: {
          label: "Compare service models",
          href: SECTION_HREFS.services,
        },
        contactForm: {
          title: "Project request for concrete requirements",
          subtitle:
            "Best when direction is clear and you want to move directly.",
          intro:
            "Share the key project facts and I reply with a practical range, timing, and budget recommendation.",
          conditionalFieldHint:
            "Based on your selected service model, I only show fields that are actually relevant.",
          firstNameLabel: "First name",
          lastNameLabel: "Last name",
          emailLabel: "Email",
          addPageLabel: "Add page",
          phoneLabel: "Phone",
          companyLabel: "Company",
          roleLabel: "Role",
          websiteLabel: "Current website",
          offerLabel: "Relevant service model",
          offerPlaceholder: "Select a service model",
          goalLabel: "Primary landing page goal",
          goalOptions: [
            {
              key: CONTACT_GOAL_KEY.GenerateInquiries,
              label: "Generate inquiries",
            },
            {
              key: CONTACT_GOAL_KEY.IncreaseBookings,
              label: "Book more calls",
            },
            { key: CONTACT_GOAL_KEY.SellProduct, label: "Sell a product" },
            {
              key: CONTACT_GOAL_KEY.GrowNewsletter,
              label: "Build a contact list",
            },
            { key: CONTACT_GOAL_KEY.OtherGoal, label: "Other goal" },
          ],
          pagesLabel: "Required pages",
          pagesPlaceholder: "e.g. Team, FAQ, Careers",
          pagesOptions: [
            { key: CONTACT_PAGE_KEY.Home, label: "Home" },
            { key: CONTACT_PAGE_KEY.Services, label: "Services" },
            { key: CONTACT_PAGE_KEY.About, label: "About" },
            { key: CONTACT_PAGE_KEY.Contact, label: "Contact" },
            { key: CONTACT_PAGE_KEY.Careers, label: "Careers" },
            { key: CONTACT_PAGE_KEY.Blog, label: "Blog" },
            { key: CONTACT_PAGE_KEY.LandingPage, label: "Landing page" },
          ],
          pagesCustomLabel: "Add another page",
          pagesCustomPlaceholder: "e.g. Sponsors",
          pagesCustomRemoveLabel: "Remove page",
          pagesRequiredHint: "Please select at least one page or add your own.",
          workflowLabel: "Type of request",
          workflowOptions: [
            {
              key: CONTACT_WORKFLOW_KEY.DigitizeExistingProcess,
              label: "Digitize an existing process",
            },
            {
              key: CONTACT_WORKFLOW_KEY.SimplifyManualProcess,
              label: "Simplify a manual process",
            },
            {
              key: CONTACT_WORKFLOW_KEY.ConnectDataOrSystems,
              label: "Connect data or systems",
            },
            {
              key: CONTACT_WORKFLOW_KEY.BuildInternalTool,
              label: "Build an internal tool for a team",
            },
            {
              key: CONTACT_WORKFLOW_KEY.ImproveExistingTool,
              label: "Improve an existing tool or system",
            },
            { key: CONTACT_WORKFLOW_KEY.OtherProcess, label: "Other request" },
          ],
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
            { key: CONTACT_BUDGET_KEY.Below1000, label: "Below €1,000" },
            {
              key: CONTACT_BUDGET_KEY.Between1000And2500,
              label: "€1,000 - €2,500",
            },
            {
              key: CONTACT_BUDGET_KEY.Between2500And5000,
              label: "€2,500 - €5,000",
            },
            {
              key: CONTACT_BUDGET_KEY.Between5000And10000,
              label: "€5,000 - €10,000",
            },
            { key: CONTACT_BUDGET_KEY.Above10000, label: "€10,000+" },
            { key: CONTACT_BUDGET_KEY.Open, label: "Not defined yet" },
          ],
          startLabel: "Preferred start",
          startOptions: [
            { key: CONTACT_START_KEY.Immediately, label: "Immediately" },
            { key: CONTACT_START_KEY.WithinTwoWeeks, label: "Within 2 weeks" },
            { key: CONTACT_START_KEY.WithinOneMonth, label: "Within 1 month" },
            { key: CONTACT_START_KEY.LaterFlexible, label: "Later / flexible" },
          ],
          projectDetailsLabel: "Notes, requirements, and project description",
          projectDetailsPlaceholder:
            "Describe your goal, audience, timeline, key pages/features, and available assets.",
          consentLabel:
            "I agree to the processing of my information according to the",
          privacyLabel: "privacy policy.",
          submitLabel: "Send request",
          submittingLabel: "Sending request …",
          submitSuccess: "Thanks. Your request has been sent successfully.",
          submitErrorValidation:
            "The request could not be sent. Please review your information.",
          submitErrorRateLimited:
            "Too many requests in a short time. Please try again in a moment.",
          submitErrorDelivery:
            "The request could not be delivered right now. Please use the email option in the contact section.",
          submitErrorGeneric:
            "The request could not be sent right now. Please try again.",
          validationSummaryPrefix: "Please fix this field",
          fieldErrorInvalidEmail: "Please enter a valid email address.",
          fieldErrorInvalidWebsite:
            "Please enter a valid website URL, for example https://www.website.com. www.website.com is invalid without the protocol.",
          fieldErrorRequired: "This field is required.",
          fieldErrorProjectDetailsRequired:
            "Please add a short project description.",
          fieldErrorPagesRequired:
            "Please select at least one page or add your own.",
          fieldErrorTooManyPages: "Please add no more than 12 custom pages.",
          fieldErrorGoalRequired: "Please select a landing page goal.",
          fieldErrorWorkflowRequired: "Please select the type of request.",
          fieldErrorConsentRequired: "Please confirm the privacy policy.",
          requiredHint: "* Required fields",
          closeLabel: "Close form",
        },
        quickContactForm: {
          title: "Short email for the next step",
          subtitle: "Best for quick first contact without a full brief.",
          intro:
            "A few lines are enough: goal, context, and what you need next.",
          metaLabel: "Email",
          firstNameLabel: "First name",
          lastNameLabel: "Last name",
          emailLabel: "Email",
          messageLabel: "Message",
          messagePlaceholder:
            "2-4 lines are enough: what this is about, the context, and what you need next.",
          consentLabel:
            "I agree to the processing of my information according to the",
          privacyLabel: "privacy policy.",
          submitLabel: "Send email",
          submittingLabel: "Sending ...",
          submitSuccess: "Your inquiry has been sent.",
          submitErrorRateLimited:
            "Too many requests in a short time. Please try again in a moment.",
          submitErrorDelivery:
            "The message could not be delivered right now. Please try again later.",
          submitErrorGeneric:
            "The inquiry could not be sent right now. Please try again later.",
          fieldErrorInvalidEmail: "Please enter a valid email address.",
          fieldErrorRequired: "This field is required.",
          fieldErrorConsentRequired: "Please confirm the privacy policy.",
          requiredHint: "* Required fields",
        },
        discoveryCallForm: {
          title: "Discovery call with a short prep note",
          subtitle:
            "Best for live alignment with a bit of context before the call.",
          intro:
            "Add your contact details and, if useful, a short note so the call can start with clearer context.",
          firstNameLabel: "First name",
          lastNameLabel: "Last name",
          emailLabel: "Email",
          messageLabel: "Topic",
          messagePlaceholder:
            "Optional: what is this roughly about and what should the call clarify?",
          consentLabel:
            "I agree to the processing of my information according to the",
          privacyLabel: "privacy policy.",
          submitLabel: "Choose a time",
          submittingLabel: "Opening the schedule ...",
          submitSuccess: "The schedule is opening with your details.",
          submitErrorRateLimited:
            "Too many requests in a short time. Please try again in a moment.",
          submitErrorGeneric:
            "The schedule could not be opened right now. Please try again later.",
          fieldErrorInvalidEmail: "Please enter a valid email address.",
          fieldErrorRequired: "This field is required.",
          fieldErrorConsentRequired: "Please confirm the privacy policy.",
          requiredHint: "* Required fields",
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
        footerColumns: [
          {
            title: "Menü",
            links: [
              { label: "Was du bekommst", href: SECTION_HREFS.included },
              { label: "Leistungsmodelle", href: SECTION_HREFS.services },
              { label: "Prozess", href: SECTION_HREFS.process },
              { label: "Q&A", href: SECTION_HREFS.faq },
              { label: "Kontakt", href: SECTION_HREFS.contact },
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
      },
      en: {
        title: "Footer",
        description: "Quick access to core pages and contact options.",
        footerColumns: [
          {
            title: "Menu",
            links: [
              { label: "What you get", href: SECTION_HREFS.included },
              { label: "Service models", href: SECTION_HREFS.services },
              { label: "Process", href: SECTION_HREFS.process },
              { label: "Q&A", href: SECTION_HREFS.faq },
              { label: "Contact", href: SECTION_HREFS.contact },
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
