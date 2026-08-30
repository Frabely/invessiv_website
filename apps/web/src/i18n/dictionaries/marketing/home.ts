import {
  CONTACT_EMAIL_SECTION_HREF,
  type ContactChannelMode,
  PRIMARY_NAVIGATION,
  SECTION_HREFS,
  type SectionId,
} from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import type { Locale } from "@/config/i18n";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { COMPANY, COMPANY_CALENDLY, COMPANY_MAILTO } from "@/config/company";
import { CONTACT_BUDGET_KEY } from "@invessiv/common/constants/contact/contact-budget-keys";
import { CONTACT_GOAL_KEY } from "@invessiv/common/constants/contact/contact-goal-keys";
import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import { CONTACT_PAGE_KEY } from "@invessiv/common/constants/contact/contact-page-keys";
import { CONTACT_START_KEY } from "@invessiv/common/constants/contact/contact-start-keys";
import { CONTACT_WORKFLOW_KEY } from "@invessiv/common/constants/contact/contact-workflow-keys";
import { getSiteHeaderUiContent } from "./site-header-ui";

type PrimaryServiceCardKey = "landing" | "process" | "upgrade" | "web";
type SecondaryServiceCardKey = "maintenance";
type ServiceCardKey = PrimaryServiceCardKey | SecondaryServiceCardKey;

type BaseServiceCard = {
  key: ServiceCardKey;
  iconSrc?: string;
  iconAlt?: string;
  title: string;
  fit?: string;
  isRecommended?: boolean;
};

type StandardServiceCardBase = BaseServiceCard & {
  description?: string;
  highlight: string;
  pricingHint: string;
  delivery: string;
  deliveryLabel?: string;
  included: string[];
  details?: string[];
};

type PrimaryServiceCard = StandardServiceCardBase & {
  key: PrimaryServiceCardKey;
};

type SecondaryServiceCard = StandardServiceCardBase & {
  key: SecondaryServiceCardKey;
  description: string;
};

export type ServiceCardCopy = PrimaryServiceCard | SecondaryServiceCard;

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

export type ProcessStepCopy = {
  step: string;
  title: string;
  deliverable: string;
  effort: string;
  result: string;
  description: string;
};

export type ProcessCtaCopy = {
  label: string;
  href: string;
};

export type QnaItemCopy = {
  question: string;
  answer: string;
  link?: {
    href: string;
    label: string;
  };
};

export type QnaSecondaryContactCopy = {
  hint: string;
  label: string;
  href: string;
};

export type ContactChannelCopy = {
  mode: ContactChannelMode;
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
};

export type ContactCtaCopy = {
  kicker?: string;
  label: string;
  href: string;
  description?: string;
  hint?: string;
};

export type ContactSecondaryCtaCopy = {
  label: string;
  href: string;
};

export type ContactFormCopy = {
  title: string;
  subtitle: string;
  intro: string;
  conditionalFieldHint: string;
  nameLabel: string;
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
  pagesHint?: string;
  pagesRequiredHint?: string;
  offerGuidance?: ContactFormOption[];
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
  projectDetailsPlaceholders?: ContactFormOption[];
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

export type QuickContactFormCopy = {
  title: string;
  subtitle: string;
  intro: string;
  metaLabel: string;
  copyActionLabel: string;
  copiedActionLabel: string;
  nameLabel: string;
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

export type DiscoveryCallFormCopy = {
  title: string;
  subtitle: string;
  intro: string;
  nameLabel: string;
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

export type FooterColumnCopy = {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

type HeroSectionCopy = {
  title: string;
  description: string;
};

type ServicesSectionCopy = {
  title: string;
  serviceCards: ServiceCardCopy[];
};

type ProofSectionCopy = {
  title: string;
  description: string;
  summaryPoints: string[];
  proofRatingAriaLabel: string;
  proofReviewLinkLabel: string;
  proofReviews: ProofReview[];
  proofFeaturedProject: ProofFeaturedProject;
  proofMoreProjects: ProofMoreProjects;
};

type ProcessSectionCopy = {
  title: string;
  description: string;
  summaryPoints: string[];
  processSteps: ProcessStepCopy[];
  processCta: ProcessCtaCopy;
};

type QnaSectionCopy = {
  title: string;
  description: string;
  qnaItems: QnaItemCopy[];
  qnaSecondaryContact: QnaSecondaryContactCopy;
};

type ContactSectionCopy = {
  title: string;
  contactDecisionIntro: string;
  contactAlternativeLabel: string;
  contactChannels: ContactChannelCopy[];
  contactSecondaryCta: ContactSecondaryCtaCopy;
  contactForm: ContactFormCopy;
  quickContactForm: QuickContactFormCopy;
  discoveryCallForm: DiscoveryCallFormCopy;
};

type FooterSectionCopy = {
  description: string;
  navColumn: FooterColumnCopy;
};

type ContentSectionMap = {
  hero: HeroSectionCopy;
  services: ServicesSectionCopy;
  proof: ProofSectionCopy;
  process: ProcessSectionCopy;
  faq: QnaSectionCopy;
  contact: ContactSectionCopy;
  footer: FooterSectionCopy;
};

type ContentSectionId = Exclude<SectionId, "problem" | "usp">;

type LocalizedLandingSection<Id extends ContentSectionId> = {
  id: Id;
  copy: Record<Locale, ContentSectionMap[Id]>;
};

export type LandingSection = {
  [Id in ContentSectionId]: LocalizedLandingSection<Id>;
}[ContentSectionId];

export type HomeSectionContent = {
  [Id in ContentSectionId]: { id: Id } & ContentSectionMap[Id];
}[ContentSectionId];

const LOCALIZED_PAGE_HREFS: Record<Locale, Partial<Record<string, string>>> = {
  de: {
    [SITE_ROUTES.HOME]: createLocalePathname(SITE_ROUTES.HOME, "de"),
    [SITE_ROUTES.IMPRINT]: createLocalePathname(SITE_ROUTES.IMPRINT, "de"),
    [SITE_ROUTES.PRIVACY]: createLocalePathname(SITE_ROUTES.PRIVACY, "de"),
    [SITE_ROUTES.TERMS]: createLocalePathname(SITE_ROUTES.TERMS, "de"),
    [SITE_ROUTES.LANDING_PAGE_SERVICE]: createLocalePathname(
      SITE_ROUTES.LANDING_PAGE_SERVICE,
      "de",
    ),
    [SITE_ROUTES.LINKEDIN_POST_SERVICE]: createLocalePathname(
      SITE_ROUTES.LINKEDIN_POST_SERVICE,
      "de",
    ),
  },
  en: {
    [SITE_ROUTES.HOME]: createLocalePathname(SITE_ROUTES.HOME, "en"),
    [SITE_ROUTES.IMPRINT]: createLocalePathname(SITE_ROUTES.IMPRINT, "en"),
    [SITE_ROUTES.PRIVACY]: createLocalePathname(SITE_ROUTES.PRIVACY, "en"),
    [SITE_ROUTES.TERMS]: createLocalePathname(SITE_ROUTES.TERMS, "en"),
    [SITE_ROUTES.LANDING_PAGE_SERVICE]: createLocalePathname(
      SITE_ROUTES.LANDING_PAGE_SERVICE,
      "en",
    ),
    [SITE_ROUTES.LINKEDIN_POST_SERVICE]: createLocalePathname(
      SITE_ROUTES.LINKEDIN_POST_SERVICE,
      "en",
    ),
  },
};

const HOME_SECTIONS = [
  {
    id: "hero",
    copy: {
      de: {
        title: "Websites, die Vertrauen schaffen und Anfragen bringen.",
        description:
          "Ich bin Moritz Hecht und entwickle verkaufspsychologisch durchdachte Websites, die dein Angebot verständlich vermitteln und Interessenten gezielt zur Anfrage führen.",
      },
      en: {
        title: "Websites that build trust and bring in inquiries.",
        description:
          "I’m Moritz Hecht, and I create conversion-focused websites that communicate your offer clearly and guide prospects toward an inquiry.",
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
        title: "Was soll deine Website erreichen?",
        serviceCards: [
          {
            key: "landing",
            iconSrc: "/services/landing-page.svg",
            iconAlt: "Landingpage Icon",
            title: "Landingpage",
            description:
              "Eine fokussierte Seite für ein konkretes Angebot, eine Kampagne oder ein klares Ziel.",
            fit: "Ein einzelnes Angebot, das verständlich präsentiert und gezielt angefragt werden soll.",
            isRecommended: true,
            highlight: "ein klarer Auftritt mit einem eindeutigen Ziel",
            pricingHint: "Individuelles Angebot nach Ziel und Umfang",
            delivery: "1–2 Wochen",
            included: [
              "Konzept für ein klares Seitenziel",
              "Individuelles Design passend zu deinem Angebot",
              "Technische Umsetzung für alle Geräte",
            ],
          },
          {
            key: "upgrade",
            iconSrc: "/services/compact-site.svg",
            iconAlt: "Kompakte Website Icon",
            title: "Kompakte Website",
            description:
              "Eine übersichtliche Webpräsenz mit den wichtigsten Inhalten und mehreren Themenbereichen.",
            fit: "Selbstständige und kleinere Unternehmen, die professionell sichtbar werden möchten.",
            highlight: "alle wichtigen Inhalte in einem stimmigen Webauftritt",
            pricingHint: "Individuelles Angebot nach Aufbau und Umfang",
            delivery: "2–4 Wochen",
            included: [
              "Klare Struktur für deine zentralen Themen",
              "Individuelle Gestaltung statt starrer Vorlage",
              "Flexible Umsetzung passend zu deinem Bedarf",
            ],
          },
          {
            key: "web",
            iconSrc: "/services/business-website.svg",
            iconAlt: "Business Website Icon",
            title: "Business Website",
            description:
              "Eine umfangreichere, individuell aufgebaute Website für Unternehmen mit mehreren Leistungen und Wachstumsplänen.",
            fit: "Unternehmen, die unterschiedliche Angebote klar vermitteln und ihren Webauftritt langfristig ausbauen möchten.",
            highlight:
              "eine starke digitale Basis, die mit dem Unternehmen wachsen kann",
            pricingHint: "Individuelles Angebot nach Anforderungen und Tiefe",
            delivery: "ab 4 Wochen",
            included: [
              "Strategische Struktur für mehrere Leistungen",
              "Eigenständiges Design passend zu deinem Unternehmen",
              "Ausbaubar Richtung Web-App: Login, Kundenbereich, eigenes Backend",
            ],
          },
          {
            key: "maintenance",
            iconSrc: "/services/customer-service-icon.svg",
            iconAlt: "Wartung und Support Icon",
            title: "Wartung & Support",
            description:
              "Planbare Pflege, technische Betreuung und kleinere Weiterentwicklungen für deine Website.",
            fit: "Websites, die nach dem Launch verlässlich betreut und weiterentwickelt werden sollen.",
            highlight: "verlässliche Hilfe für laufende Anpassungen",
            pricingHint: "Nach Aufwand oder abgestimmtem Betreuungspaket",
            delivery: "ca. 24h",
            deliveryLabel: "Antwortzeit",
            included: [
              "Kleine Inhalts- und Layoutänderungen",
              "Bugfixes und technische Korrekturen",
              "Kleinere Erweiterungen nach Aufwand",
              "Optional regelmäßige Qualitäts- und Funktionschecks",
              "Priorisierung nach Dringlichkeit und Business-Nutzen",
            ],
            details: [
              "Du zahlst nur den abgestimmten oder tatsächlich erfassten Aufwand mit klarer Aufstellung.",
              "Notfallanfragen werden nach Verfügbarkeit priorisiert; feste Reaktionszeiten nur mit abgestimmtem Support-Paket.",
            ],
          },
        ],
      },
      en: {
        title: "What should your website achieve?",
        serviceCards: [
          {
            key: "landing",
            iconSrc: "/services/landing-page.svg",
            iconAlt: "Landing page icon",
            title: "Landing page",
            description:
              "A focused page for one specific offer, campaign, or clearly defined goal.",
            fit: "A single offer that needs to be presented clearly and guide visitors toward an inquiry.",
            isRecommended: true,
            highlight: "a focused presence built around one clear goal",
            pricingHint: "Individual quote based on goal and scope",
            delivery: "1–2 weeks",
            included: [
              "A concept built around one clear page goal",
              "Custom design tailored to your offer",
              "Technical implementation for every device",
            ],
          },
          {
            key: "upgrade",
            iconSrc: "/services/compact-site.svg",
            iconAlt: "Compact website icon",
            title: "Compact Website",
            description:
              "A clear web presence with your essential content organised across several key topics.",
            fit: "Self-employed professionals and smaller businesses that want a credible, professional presence online.",
            highlight: "all essential content in one coherent web presence",
            pricingHint: "Individual quote based on structure and scope",
            delivery: "2–4 weeks",
            included: [
              "A clear structure for your core topics",
              "Custom design instead of a rigid template",
              "Flexible implementation shaped around your needs",
            ],
          },
          {
            key: "web",
            iconSrc: "/services/business-website.svg",
            iconAlt: "Business website icon",
            title: "Business Website",
            description:
              "A more extensive, individually structured website for businesses with multiple services and plans for growth.",
            fit: "Businesses that need to communicate different services clearly and expand their website over time.",
            highlight:
              "a strong digital foundation that can grow with your business",
            pricingHint: "Individual quote based on requirements and depth",
            delivery: "from 4 weeks",
            included: [
              "Strategic structure for multiple services",
              "A distinctive design tailored to your business",
              "Extendable toward a web app: login, client area, own backend",
            ],
          },
          {
            key: "maintenance",
            iconSrc: "/services/customer-service-icon.svg",
            iconAlt: "Maintenance and support icon",
            title: "Maintenance & support",
            description:
              "Planned upkeep, technical support, and smaller enhancements for your website.",
            fit: "Websites that should remain reliable and continue to evolve after launch.",
            highlight: "reliable help for ongoing changes",
            pricingHint: "By effort or an agreed support retainer",
            delivery: "approx. 24h",
            deliveryLabel: "Response time",
            included: [
              "Small content and layout changes",
              "Bugfixes and technical corrections",
              "Smaller extensions by effort",
              "Optional recurring quality and function checks",
              "Prioritization by urgency and business value",
            ],
            details: [
              "You only pay for the agreed or actually logged effort with a clear breakdown.",
              "Urgent requests are prioritized by availability; fixed response times require an agreed support package.",
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
        title: "Von der Anfrage zur klaren Entscheidung in vier Schritten",
        description:
          "Der Ablauf reduziert Risiko vor dem Start: Du bekommst schnell Klarheit zu Ziel, Umfang, Timing und dem nächsten sinnvollen Schritt.",
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
              "Wir klären Ziel, Zielgruppe, vorhandenes Material und Rahmen. Danach bekommst du eine Empfehlung, welches Leistungsmodell wirklich passt.",
          },
          {
            step: "02",
            title: "Struktur & erster Draft",
            deliverable: "Klickbarer Draft oder Prototyp",
            effort: "Lieferzeit: früh im Projekt sichtbar (je nach Umfang)",
            result: "Ergebnis: Seitenstruktur oder Kern-Workflow",
            description:
              "Ich entwickle die Seitenlogik oder den ersten Prototypen. So siehst du früh, ob Angebot, Inhalte und Anfrageweg zusammenpassen.",
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
          label: "Angebot einschätzen lassen",
          href: SECTION_HREFS.contact,
        },
      },
      en: {
        title: "From request to clear decision in four steps",
        description:
          "The flow reduces risk before kickoff: you quickly get clarity on goal, scope, timing, and the next sensible step.",
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
              "We align on the goal, audience, available materials, and frame. After that, you get a recommendation on the service model that actually fits.",
          },
          {
            step: "02",
            title: "Structure & first draft",
            deliverable: "Clickable draft or prototype",
            effort: "Delivery: visible early in the project",
            result: "Outcome: page structure or core workflow",
            description:
              "I develop the page logic or first prototype. This shows early whether the offer, content, and inquiry path work together.",
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
          label: "Get an offer estimate",
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
        description:
          "Die wichtigsten Fragen vor dem Projektstart sind hier bewusst knapp, konkret und ohne Vertriebssprache beantwortet.",
        qnaSecondaryContact: {
          hint: "Frage nicht dabei?",
          label: "Schreib mir direkt per Mail.",
          href: CONTACT_EMAIL_SECTION_HREF,
        },
        qnaItems: [
          {
            question: "Wie läuft der Projektstart ab?",
            answer:
              "Nach deiner Anfrage kläre ich Ziel, Umfang und Zeitrahmen in einem kurzen Call oder per E-Mail. Danach erhältst du eine klare Empfehlung zum passenden Leistungsmodell, den nächsten Schritt und bei Bedarf ein individuelles Angebot für die Umsetzung. Für klassische Einzel-Landingpages gibt es einen eigenen Ablauf auf der Landingpage-Detailseite.",
            link: {
              label: "Mehr zu Landingpages",
              href: SITE_ROUTES.LANDING_PAGE_SERVICE,
            },
          },
          {
            question: "Kannst du meine bestehende Webseite überarbeiten?",
            answer:
              "Ja. Ich kann bestehende Seiten gezielt modernisieren, technisch stabilisieren und für Conversion verbessern, ohne alles neu zu bauen. Falls ein kompletter Relaunch sinnvoller ist, sage ich das offen vorab.",
          },
          {
            question: "Welche Tools setzt du ein?",
            answer:
              "Ich arbeite mit einem modernen Projekt-Setup rund um Next.js, Tailwind und passenden Analyse- bzw. Automatisierungs-Tools. Schnelle Build-Workflows nutze ich dort, wo sie sinnvoll sind, die Verantwortung für Architektur, Review und QA bleibt aber bei mir.",
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
        description:
          "The most relevant pre-project questions are answered here in a concise, direct format without sales fluff.",
        qnaSecondaryContact: {
          hint: "Question not listed?",
          label: "Write to me directly by email.",
          href: CONTACT_EMAIL_SECTION_HREF,
        },
        qnaItems: [
          {
            question: "How does project kickoff work?",
            answer:
              "After your request, I align on goals, project range, and timeline in a short call or by email. You then get a clear recommendation on the right service model, the next step, and, where useful, an individual offer for delivery. Classic single landing pages have their own process on the landing page detail page.",
            link: {
              label: "View landing page details",
              href: SITE_ROUTES.LANDING_PAGE_SERVICE,
            },
          },
          {
            question: "Can you redesign my existing website?",
            answer:
              "Yes. I can modernize existing pages, improve technical stability, and optimize for conversion without rebuilding everything from scratch. If a full relaunch is the better option, I tell you upfront.",
          },
          {
            question: "Which tools do you use?",
            answer:
              "I work with a modern project setup around Next.js, Tailwind, and suitable analytics or automation tools. Where fast build workflows help, I use them, but architecture, review, and QA stay under my responsibility.",
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
        title: "Starte mit einer Projektanfrage",
        contactDecisionIntro:
          "Du brauchst noch kein fertiges Briefing. Wähle aus, worum es ungefähr geht - die Fragen passen sich daran an und machen dein Vorhaben schneller einschätzbar.",
        contactAlternativeLabel: "Falls es noch kürzer sein soll",
        contactChannels: [
          {
            mode: "call",
            kicker: "Optional",
            label: "Kennenlern-Call",
            description:
              "Für direkte Abstimmung, wenn du noch unsicher bist, welcher Leistungsweg passt.",
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
            kicker: "Kurz",
            label: "Kurze Nachricht",
            description:
              "Für schnelle Rückfragen, wenn eine vollständige Projektanfrage noch zu früh ist.",
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
        contactSecondaryCta: {
          label: "Leistungsmodelle vergleichen",
          href: SECTION_HREFS.services,
        },
        contactForm: {
          title: "Projekt einschätzen lassen",
          subtitle: "Für konkrete Vorhaben mit klarer nächster Entscheidung.",
          intro:
            "Teile die wichtigsten Eckdaten. Du bekommst eine klare Einschätzung zu Umfang, Timing und Budgetrahmen.",
          conditionalFieldHint:
            "Wähle eines der drei Angebote. Die nächsten Fragen passen sich daran an.",
          nameLabel: "Name",
          emailLabel: "E-Mail",
          addPageLabel: "Seite hinzufügen",
          phoneLabel: "Telefon",
          companyLabel: "Unternehmen",
          roleLabel: "Rolle",
          websiteLabel: "Aktuelle Webseite",
          offerLabel: "Passendes Angebot",
          offerPlaceholder: "Angebot wählen",
          goalLabel: "Ziel des Webauftritts",
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
          pagesLabel: "Grobe Seitenidee",
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
          pagesHint:
            "Falls du noch nicht sicher bist, klären wir den sinnvollen Umfang gemeinsam.",
          pagesCustomLabel: "Weitere Seite hinzufügen",
          pagesCustomPlaceholder: "z. B. Sponsoren",
          pagesCustomRemoveLabel: "Seite entfernen",
          pagesRequiredHint:
            "Bitte wähle mindestens eine Seite oder ergänze eine eigene.",
          offerGuidance: [
            {
              key: CONTACT_OFFER_KEY.Landing,
              label:
                "Für Landingpages, neue Websites, Relaunches oder gezielte Verbesserungen bestehender Seiten.",
            },
            {
              key: CONTACT_OFFER_KEY.Process,
              label:
                "Für wiederkehrende Abläufe: vom Custom KI-Skill bis zur individuellen Softwarelösung.",
            },
            {
              key: CONTACT_OFFER_KEY.Maintenance,
              label:
                "Für bestehende Websites, Tools oder laufende Änderungen nach dem Launch.",
            },
          ],
          workflowLabel: "Wiederkehrender Prozess oder Workflow",
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
          projectDetailsPlaceholders: [
            {
              key: CONTACT_OFFER_KEY.Landing,
              label:
                "Beschreibe Angebot, Zielgruppe, Ziel der Seite, vorhandene Inhalte und was am aktuellen Auftritt besser werden soll.",
            },
            {
              key: CONTACT_OFFER_KEY.Process,
              label:
                "Beschreibe den wiederkehrenden Ablauf, heutige Tools, manuelle Schritte und ob eher ein Custom KI-Skill oder eine Softwarelösung naheliegt.",
            },
            {
              key: CONTACT_OFFER_KEY.Maintenance,
              label:
                "Beschreibe bestehendes Projekt, gewünschte Änderung, Wartungsbedarf, Dringlichkeit und bekannte technische Rahmenbedingungen.",
            },
          ],
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
          fieldErrorGoalRequired: "Bitte wähle ein Ziel für den Webauftritt.",
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
          copyActionLabel: "Adresse kopieren",
          copiedActionLabel: "Adresse kopiert",
          nameLabel: "Name",
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
          nameLabel: "Name",
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
        title: "Start with a project request",
        contactDecisionIntro:
          "You do not need a finished brief yet. Choose what your project is roughly about - the questions adapt and make the request easier to estimate.",
        contactAlternativeLabel: "If you need a shorter path",
        contactChannels: [
          {
            mode: "call",
            kicker: "Optional",
            label: "Discovery call",
            description:
              "Best for live alignment when you are still unsure which service path fits.",
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
            kicker: "Short",
            label: "Quick message",
            description:
              "Best for quick questions when a full project request feels too early.",
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
        contactSecondaryCta: {
          label: "Compare service models",
          href: SECTION_HREFS.services,
        },
        contactForm: {
          title: "Get a project estimate",
          subtitle: "For concrete requirements with a clear next decision.",
          intro:
            "Share the key facts. You get a clear view on scope, timing, and budget range.",
          conditionalFieldHint:
            "Choose one of the three offers. The next questions adapt to it.",
          nameLabel: "Name",
          emailLabel: "Email",
          addPageLabel: "Add page",
          phoneLabel: "Phone",
          companyLabel: "Company",
          roleLabel: "Role",
          websiteLabel: "Current website",
          offerLabel: "Relevant offer",
          offerPlaceholder: "Choose an offer",
          goalLabel: "Goal of the web presence",
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
          pagesLabel: "Rough page idea",
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
          pagesHint:
            "If you are not sure yet, we will clarify the useful scope together.",
          pagesCustomLabel: "Add another page",
          pagesCustomPlaceholder: "e.g. Sponsors",
          pagesCustomRemoveLabel: "Remove page",
          pagesRequiredHint: "Please select at least one page or add your own.",
          offerGuidance: [
            {
              key: CONTACT_OFFER_KEY.Landing,
              label:
                "For landing pages, new websites, relaunches, or focused improvements to existing sites.",
            },
            {
              key: CONTACT_OFFER_KEY.Process,
              label:
                "For recurring workflows: from a custom AI skill to a bespoke software solution.",
            },
            {
              key: CONTACT_OFFER_KEY.Maintenance,
              label:
                "For existing websites, tools, or ongoing changes after launch.",
            },
          ],
          workflowLabel: "Recurring process or workflow",
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
          projectDetailsPlaceholders: [
            {
              key: CONTACT_OFFER_KEY.Landing,
              label:
                "Describe the offer, audience, page goal, available content, and what should improve in the current presence.",
            },
            {
              key: CONTACT_OFFER_KEY.Process,
              label:
                "Describe the recurring workflow, current tools, manual steps, and whether a custom AI skill or software solution seems more likely.",
            },
            {
              key: CONTACT_OFFER_KEY.Maintenance,
              label:
                "Describe the existing project, requested change, maintenance need, urgency, and known technical context.",
            },
          ],
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
          fieldErrorGoalRequired: "Please select a goal for the web presence.",
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
          copyActionLabel: "Copy address",
          copiedActionLabel: "Address copied",
          nameLabel: "Name",
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
          nameLabel: "Name",
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
        description:
          "Schnellzugriff auf die wichtigsten Bereiche und Kontaktwege.",
        navColumn: { title: "Menü", links: [] },
      },
      en: {
        description: "Quick access to core pages and contact options.",
        navColumn: { title: "Menu", links: [] },
      },
    },
  },
] satisfies LandingSection[];

export function getHomeSections(locale: Locale): HomeSectionContent[] {
  const siteHeaderUi = getSiteHeaderUiContent(locale);
  const primaryNavigationLinks = PRIMARY_NAVIGATION.map((item) => ({
    href: item.href,
    label: siteHeaderUi.labelsByHref[item.href] ?? item.href,
  }));

  const localizeInternalHref = (href: string) => {
    if (!href.startsWith("/")) {
      return href;
    }

    const hashIndex = href.indexOf("#");
    const pathname = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
    const localizedPathname = LOCALIZED_PAGE_HREFS[locale][pathname];

    return localizedPathname ? `${localizedPathname}${hash}` : href;
  };

  return HOME_SECTIONS.map((section): HomeSectionContent => {
    if (section.id !== "footer") {
      const localizedSection = {
        id: section.id,
        ...section.copy[locale],
      } as HomeSectionContent;

      if (localizedSection.id !== "faq") {
        return localizedSection;
      }

      return {
        ...localizedSection,
        qnaItems: localizedSection.qnaItems.map((item) => ({
          ...item,
          link: item.link
            ? {
                ...item.link,
                href: localizeInternalHref(item.link.href),
              }
            : undefined,
        })),
      } as HomeSectionContent;
    }

    const localizedSection = {
      id: section.id,
      ...section.copy[locale],
    };

    return {
      ...localizedSection,
      navColumn: {
        ...localizedSection.navColumn,
        links: primaryNavigationLinks,
      },
    };
  });
}
