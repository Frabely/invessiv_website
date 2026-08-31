import {
  CONTACT_EMAIL_SECTION_HREF,
  PRIMARY_NAVIGATION,
  SECTION_HREFS,
  type SectionId,
} from "@/config/navigation/home";
import { SITE_ROUTES } from "@/config/routes";
import type { Locale } from "@/config/i18n";
import type {
  QnaIntroCopy,
  QnaItemCopy,
  QnaSecondaryContactCopy,
} from "@/common/contracts/marketing/qna-copy";
import type { ReferenceEntry } from "@/common/contracts/marketing/reference-entry";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import {
  CONTACT_PROJECT_SCOPE,
  type ContactProjectScope,
} from "@invessiv/common/constants/contact/contact-project-scopes";
import processDe from "./home-process.de.json";
import processEn from "./home-process.en.json";
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

export type ProcessStepCopy = {
  step: string;
  title: string;
  effort: string;
  result: string;
};

export type ProcessCtaCopy = {
  label: string;
  href: string;
};

export type ContactPortraitCopy = {
  imageAlt: string;
};

export type ContactFormCopy = {
  nameLabel: string;
  emailLabel: string;
  projectScopeLabel: string;
  projectScopeOptions: Record<ContactProjectScope, string>;
  messageLabel: string;
  messagePlaceholder: string;
  consentLabel: string;
  privacyLabel: string;
  privacySuffix: string;
  requiredHint: string;
  honeypotLabel: string;
  fieldErrorInvalidEmail: string;
  fieldErrorRequired: string;
  fieldErrorConsentRequired: string;
  submitErrorRateLimited: string;
  submitErrorGeneric: string;
  callSubmitLabel: string;
  callSubmittingLabel: string;
  callSubmitSuccess: string;
  emailQuestion: string;
  emailNote: string;
  emailSubmitLabel: string;
  emailSubmittingLabel: string;
  emailSubmitSuccess: string;
  emailSubmitErrorDelivery: string;
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

type ReferencesSectionCopy = {
  kicker: string;
  title: string;
  referenceEntries: ReferenceEntry[];
};

type ProcessSectionCopy = {
  title: string;
  processSteps: ProcessStepCopy[];
  processCta: ProcessCtaCopy;
};

type ProcessDictionaryContent = {
  title: string;
  processSteps: ProcessStepCopy[];
  processCtaLabel: string;
};

function createProcessSectionCopy({
  processCtaLabel,
  ...content
}: ProcessDictionaryContent): ProcessSectionCopy {
  return {
    ...content,
    processCta: {
      label: processCtaLabel,
      href: SECTION_HREFS.contact,
    },
  };
}

type QnaSectionCopy = {
  title: string;
  qnaIntro: QnaIntroCopy;
  qnaAvatarAlt: string;
  qnaItems: QnaItemCopy[];
  qnaSecondaryContact: QnaSecondaryContactCopy;
};

type ContactSectionCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  portrait: ContactPortraitCopy;
  contactForm: ContactFormCopy;
};

type FooterSectionCopy = {
  description: string;
  navColumn: FooterColumnCopy;
};

type ContentSectionMap = {
  hero: HeroSectionCopy;
  services: ServicesSectionCopy;
  references: ReferencesSectionCopy;
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
    id: "references",
    copy: {
      de: {
        kicker: "Projekte & Kundenstimmen",
        title: "Was entsteht, wenn wir zusammenarbeiten?",
        referenceEntries: [
          {
            authorName: "Dr. Christoph Allmacher",
            avatarKey: "allmacher",
            avatarAlt: "Porträt von Dr. Christoph Allmacher",
            role: "Allmacher Coaching, Verhandlungstraining in Chemnitz",
            selectorLabel: "Allmacher Coaching",
            quote:
              "Ich erstelle meine Website aktuell gemeinsam mit Moritz und bin mit der Zusammenarbeit sehr zufrieden. Die Kommunikation über WhatsApp ist unkompliziert, direkt und schnell, sodass Fragen jederzeit leicht geklärt werden können. Besonders schätze ich, dass Moritz sich Zeit nimmt, Zusammenhänge verständlich erklärt und nicht einfach nur „abarbeitet“. Die Zusammenarbeit ist angenehm entspannt und dennoch sehr professionell – ohne künstlichen Zeitdruck oder eine rein geschäftliche Atmosphäre. Eigene Ideen werden ernst genommen, konstruktiv weiterentwickelt und zuverlässig umgesetzt. Ich würde mich jederzeit wieder für eine Zusammenarbeit mit Moritz entscheiden und kann ihn uneingeschränkt weiterempfehlen.",
            imageKey: "allmacher",
            imageAlt:
              "Startseite von Allmacher Coaching mit dem Verhandlungsseminar in Chemnitz",
            siteLabel: "allmacher-coaching.de",
            linkLabel: "Projekt im Detail ansehen",
          },
          {
            authorName: "Kolja Wienigk",
            role: "Finanzmakler aus Dresden",
            quote:
              "Vom ersten Gespräch an war klar, welche Schritte sinnvoll sind und worauf wir zuerst den Fokus legen sollten. Die Umsetzung wirkte strukturiert, schnell und ohne unnötige Schleifen.",
            avatarKey: "kolja",
            avatarAlt: "Porträt von Kolja Wienigk",
            imageKey: "kolja",
            selectorLabel: "Kolja Wienigk · Finanzmakler",
            imageAlt:
              "Startseite der Finanzberatung von Kolja Wienigk mit klarer Struktur",
            siteLabel: "kolja-wienigk.de",
            linkLabel: "Projekt im Detail ansehen",
          },
        ],
      },
      en: {
        kicker: "Projects & client voices",
        title: "What can we create together?",
        referenceEntries: [
          {
            authorName: "Dr. Christoph Allmacher",
            avatarKey: "allmacher",
            avatarAlt: "Portrait of Dr Christoph Allmacher",
            role: "Allmacher Coaching, negotiation training in Chemnitz",
            selectorLabel: "Allmacher Coaching",
            quote:
              "I am building my website together with Moritz right now, and I am very happy with how we work together. Communication over WhatsApp is easy, direct, and fast, so questions get sorted out whenever they come up. What I value most is that Moritz takes the time to explain how things connect instead of simply working through a list. The collaboration feels relaxed and still very professional, without artificial time pressure or a purely transactional tone. My own ideas are taken seriously, developed further, and implemented reliably. I would work with Moritz again at any time and can recommend him without reservation.",
            imageKey: "allmacher",
            imageAlt:
              "Homepage of Allmacher Coaching with the negotiation seminar in Chemnitz",
            siteLabel: "allmacher-coaching.de",
            linkLabel: "View project details",
          },
          {
            authorName: "Kolja Wienigk",
            role: "Financial broker from Dresden",
            quote:
              "From the first conversation onward, it was clear which steps made sense and what should be prioritised first. The delivery felt structured, fast, and free of unnecessary loops.",
            avatarKey: "kolja",
            avatarAlt: "Portrait of Kolja Wienigk",
            imageKey: "kolja",
            selectorLabel: "Kolja Wienigk · Financial Broker",
            imageAlt:
              "Homepage of Kolja Wienigk's financial advice with a clear structure",
            siteLabel: "kolja-wienigk.de",
            linkLabel: "View project details",
          },
        ],
      },
    },
  },
  {
    id: "services",
    copy: {
      de: {
        title: "Was hast du mit deiner Website vor?",
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
        title: "What are you planning for your website?",
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
      de: createProcessSectionCopy(processDe),
      en: createProcessSectionCopy(processEn),
    },
  },
  {
    id: "faq",
    copy: {
      de: {
        title: "Q&A",
        qnaIntro: {
          primary: "Hast du noch Fragen?",
          secondary: "Hier sind Fragen, die mir häufig gestellt werden.",
        },
        qnaAvatarAlt: "Moritz Hecht, Webentwickler aus Chemnitz",
        qnaSecondaryContact: {
          hint: "Frage nicht dabei?",
          label: "Schreib mir direkt per Mail.",
          href: CONTACT_EMAIL_SECTION_HREF,
        },
        qnaItems: [
          {
            question: "Wem gehört die Website danach?",
            answer:
              "Dir. Domain, Hosting-Zugänge, Inhalte und der fertige Code laufen über Accounts auf deinen Namen und werden sauber übergeben. Du behältst die volle Kontrolle über deine Website.",
          },
          {
            question: "Was kostet ein Projekt?",
            answer:
              "Der Preis hängt vom Umfang ab, deshalb nenne ich dir keinen Preis ins Blaue hinein. Wir sprechen vorher über dein Ziel und den nötigen Aufwand, danach bekommst du ein schriftliches Festpreisangebot ohne versteckte Posten. Alles, was später dazukommt, stimme ich vorher mit dir ab.",
          },
          {
            question: "Wie läuft der Projektstart ab?",
            answer:
              "Der Projektstart ist bei mir das Onboarding: Wir schauen uns vorhandene Assets an, sprechen Ideen noch einmal im Detail durch und klären, wie die Seite am Ende aussehen soll. Dafür brauche ich die Zugänge, Fotos, Videos und weitere Materialien, die wir für die Website brauchen, damit ich sauber loslegen kann.",
          },
          {
            question: "Wie viele Korrekturen sind enthalten?",
            answer:
              "Wie viele Korrekturen enthalten sind, klären wir individuell und halten es in deinem Angebot fest. Alles darüber hinaus stimmen wir vorab mit dir ab.",
          },
          {
            question: "Was ist im Angebot typischerweise nicht enthalten?",
            answer:
              "Typisch nicht enthalten sind Hosting, Domain, externe Tool- oder Lizenzkosten sowie Integrationen außerhalb des vereinbarten Umfangs. Texte schreibe ich normalerweise selbst, außer du möchtest es ausdrücklich anders. Bilder und Videos kommen idealerweise von dir; wenn noch nichts da ist, arbeite ich nach Absprache vorerst mit KI- oder Stockmaterial.",
          },
          {
            question: "Was passiert nach dem Launch?",
            answer:
              "Nach dem Go-live bist du nicht von mir abhängig. Üblicherweise geht das in eine laufende Wartung oder Betreuung über, wenn du das möchtest. Mir ist wichtig, Kunden auch nach dem Launch verlässlich und professionell weiter zu begleiten. Theoretisch kannst du die Website aber auch einfach übernehmen und ohne weitere Zusammenarbeit weiterlaufen lassen. Wir entscheiden dann gemeinsam, was für dich sinnvoll ist.",
          },
          {
            question: "Kann ich Inhalte später selbst ändern?",
            answer:
              "Ja. Meistens übernehme ich Änderungen für dich: Du schreibst mir kurz, was angepasst werden soll, und ich kümmere mich darum. Für viele ist das der schnellere Weg. Wenn du Inhalte selbst pflegen willst, bauen wir ein CMS ein und sprechen das vor dem Start ab.",
          },
          {
            question: "Was brauche ich von dir für einen sauberen Start?",
            answer:
              "Ich brauche von dir zeitnahes Feedback, Freigaben, die nötigen Zugänge und, wenn vorhanden, Texte, Bilder und Videos. Der größte Teil davon fällt einmalig beim Onboarding an. Wenn Rückmeldungen länger dauern, verschiebt sich der Zeitplan entsprechend.",
          },
          {
            question: "Wie gehst du mit Zusatzwünschen um?",
            answer:
              "Zusatzwünsche außerhalb des vereinbarten Rahmens setze ich nicht einfach stillschweigend um. Ich sage dir vorher, was sie für Aufwand, Timing und Preis bedeuten, und starte erst nach kurzer Freigabe per E-Mail.",
          },
          {
            question: "Welche Tools setzt du ein?",
            answer:
              "Ich arbeite mit Next.js, Tailwind, Vercel und Resend. Der Stack bleibt bewusst schlank: schnelle Ladezeiten, wenig Wartung, keine unnötigen Abhängigkeiten. Die technische Verantwortung für Architektur, Review und QA bleibt bei mir.",
          },
          {
            question: "Wann gilt ein Projekt als abgeschlossen?",
            answer:
              "Abgeschlossen ist ein Projekt, wenn der vereinbarte Umfang geliefert und die Seite live bzw. übergeben ist. Was danach dazukommt, behandeln wir als eigenen Folgeauftrag, wenn es nicht vom vereinbarten Rahmen abweicht.",
          },
        ],
      },
      en: {
        title: "Q&A",
        qnaIntro: {
          primary: "Still have questions?",
          secondary: "Here are the questions I get asked most often.",
        },
        qnaAvatarAlt: "Moritz Hecht, web developer from Chemnitz",
        qnaSecondaryContact: {
          hint: "Question not listed?",
          label: "Write to me directly by email.",
          href: CONTACT_EMAIL_SECTION_HREF,
        },
        qnaItems: [
          {
            question: "Who owns the website afterwards?",
            answer:
              "You do. Domain, hosting access, content, and the finished code run through accounts registered in your name and are handed over to you. You keep full control of your website.",
          },
          {
            question: "What does a project cost?",
            answer:
              "The price depends on the project range, so I never pull a number out of thin air. We talk about your goal and the actual effort first, then you receive a written fixed-price offer with no hidden items. Anything that comes up later is agreed with you in advance.",
          },
          {
            question: "How does project kickoff work?",
            answer:
              "Project kickoff means onboarding with me: we look through the available assets, go through the ideas in detail once more, and define how the site should look in the end. I also need the access, photos, videos, and any other material required to build the website so I can start cleanly.",
          },
          {
            question: "How many revision rounds are included?",
            answer:
              "How many are included exactly depends on the project. We decide that individually and spell it out in your offer. Anything beyond that is agreed in advance.",
          },
          {
            question: "What is typically not included in the offer?",
            answer:
              "What is usually not included: hosting, domain, external tool or license costs, and integrations outside the agreed project range. I normally write the texts myself unless you explicitly want it differently. Images and videos are ideally provided by you; if nothing is available yet, I can use AI or stock material for the time being.",
          },
          {
            question: "What happens after launch?",
            answer:
              "I do not disappear after go-live. Usually that moves into ongoing maintenance or support if you want it. It matters to me to keep supporting clients reliably and professionally after launch. In theory, though, you can also take over the website and keep it running without any further collaboration. What comes next depends on what makes sense for you.",
          },
          {
            question: "Can I edit the content myself later?",
            answer:
              "Yes. As a rule I handle changes for you: you send me a short message about what needs updating and I take care of it. For most clients that is the faster route. If you would rather maintain content yourself, we build in a CMS and discuss that before the project starts.",
          },
          {
            question: "What do I need from you for a clean start?",
            answer:
              "I need timely feedback, approvals, the required access, and, where available, your texts, images, and videos. Most of that happens once, during onboarding. If responses take longer, the timeline shifts accordingly.",
          },
          {
            question: "How are additional requests handled?",
            answer:
              "Requests outside the agreed frame are not implemented silently. I first share the impact on effort, timeline, and price, and proceed only after short written confirmation by email.",
          },
          {
            question: "Which tools do you use?",
            answer:
              "I work with Next.js, Tailwind, Vercel, and Resend. The stack stays deliberately lean: fast load times, little maintenance, no unnecessary dependencies. Technical responsibility for architecture, review, and QA stays with me.",
          },
          {
            question: "When is a project considered completed?",
            answer:
              "A project is complete once the agreed scope has been delivered and the site is live or handed over. Anything after that is treated as its own follow-up assignment if it goes beyond the agreed frame.",
          },
        ],
      },
    },
  },
  {
    id: "contact",
    copy: {
      de: {
        eyebrow: "Kontakt",
        title: "Lass uns über dein Vorhaben sprechen.",
        intro:
          "15 Minuten, kostenlos und unverbindlich. Danach weißt du, was deine Website braucht und was sie ungefähr kostet.",
        portrait: {
          imageAlt: "Porträt von Moritz Hecht",
        },
        contactForm: {
          nameLabel: "Name",
          emailLabel: "E-Mail",
          projectScopeLabel: "Leistungsmodell (optional)",
          projectScopeOptions: {
            [CONTACT_PROJECT_SCOPE.LandingPage]: "Landingpage",
            [CONTACT_PROJECT_SCOPE.CompactWebsite]: "Kompakte Website",
            [CONTACT_PROJECT_SCOPE.BusinessWebsite]: "Business Website",
          },
          messageLabel: "Worum geht es? (optional)",
          messagePlaceholder: "Zwei Sätze reichen.",
          consentLabel: "Ich stimme der Verarbeitung meiner Angaben gemäß",
          privacyLabel: "Datenschutzerklärung",
          privacySuffix: " zu.",
          requiredHint: "* Pflichtfelder",
          honeypotLabel: "Bitte nicht ausfüllen",
          fieldErrorInvalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
          fieldErrorRequired: "Dieses Feld ist erforderlich.",
          fieldErrorConsentRequired:
            "Bitte bestätige die Datenschutzerklärung.",
          submitErrorRateLimited:
            "Zu viele Anfragen in kurzer Zeit. Bitte versuche es gleich noch einmal.",
          submitErrorGeneric:
            "Das hat gerade nicht geklappt. Bitte versuche es später erneut.",
          callSubmitLabel: "Kostenloses Erstgespräch anfragen",
          callSubmittingLabel: "Terminauswahl wird geöffnet ...",
          callSubmitSuccess:
            "Die Terminauswahl öffnet sich mit deinen Angaben.",
          emailQuestion: "Doch lieber schreiben?",
          emailNote:
            "Dann geht das ausgefüllte Formular direkt an mich, ohne Terminauswahl. Ich antworte in der Regel innerhalb von 24 Stunden.",
          emailSubmitLabel: "Anfrage senden",
          emailSubmittingLabel: "Wird gesendet ...",
          emailSubmitSuccess: "Anfrage ist da. Ich melde mich bei dir.",
          emailSubmitErrorDelivery:
            "Die Nachricht konnte gerade nicht zugestellt werden. Bitte versuch es später noch einmal.",
        },
      },
      en: {
        eyebrow: "Contact",
        title: "Let's talk about your project.",
        intro:
          "15 minutes, free and without obligation. Afterwards you know what your website needs and roughly what it costs.",
        portrait: {
          imageAlt: "Portrait of Moritz Hecht",
        },
        contactForm: {
          nameLabel: "Name",
          emailLabel: "Email",
          projectScopeLabel: "Service (optional)",
          projectScopeOptions: {
            [CONTACT_PROJECT_SCOPE.LandingPage]: "Landing page",
            [CONTACT_PROJECT_SCOPE.CompactWebsite]: "Compact website",
            [CONTACT_PROJECT_SCOPE.BusinessWebsite]: "Business website",
          },
          messageLabel: "What's it about? (optional)",
          messagePlaceholder: "Two sentences are enough.",
          consentLabel:
            "I agree to the processing of my information according to the",
          privacyLabel: "privacy policy",
          privacySuffix: ".",
          requiredHint: "* Required fields",
          honeypotLabel: "Please leave this empty",
          fieldErrorInvalidEmail: "Please enter a valid email address.",
          fieldErrorRequired: "This field is required.",
          fieldErrorConsentRequired: "Please confirm the privacy policy.",
          submitErrorRateLimited:
            "Too many requests in a short time. Please try again in a moment.",
          submitErrorGeneric:
            "That did not work just now. Please try again later.",
          callSubmitLabel: "Request a free intro call",
          callSubmittingLabel: "Opening the calendar ...",
          callSubmitSuccess: "The calendar is opening with your details.",
          emailQuestion: "Rather write instead?",
          emailNote:
            "Then the form above goes straight to me, without booking a time. I usually reply within 24 hours.",
          emailSubmitLabel: "Send inquiry",
          emailSubmittingLabel: "Sending ...",
          emailSubmitSuccess: "Got it. I'll get back to you.",
          emailSubmitErrorDelivery:
            "The message could not be delivered right now. Please try again later.",
        },
      },
    },
  },
  {
    id: "footer",
    copy: {
      de: {
        description:
          "Verkaufspsychologisch durchdachte Websites, die dein Angebot verständlich vermitteln und Interessenten zur Anfrage führen.",
        navColumn: { title: "Menü", links: [] },
      },
      en: {
        description:
          "Conversion-focused websites that communicate your offer clearly and guide prospects toward an inquiry.",
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
