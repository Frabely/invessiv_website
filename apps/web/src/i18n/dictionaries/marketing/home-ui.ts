import type { ReferenceLabels } from "@/common/contracts/marketing/reference-labels";
import type { Locale } from "@/config/i18n";
import type { ServiceOption } from "@/common/contracts/marketing";
import de from "./home-ui.de.json";
import en from "./home-ui.en.json";

export const PROBLEM_ICON_KEYS = [
  "outdated",
  "mobile",
  "unclear",
  "trust",
  "inquiries",
  "contact",
] as const;

export type ProblemIconKey = (typeof PROBLEM_ICON_KEYS)[number];

type ProblemItem = {
  iconKey: ProblemIconKey;
  label: string;
};

type ProblemContent = {
  conclusion: string;
  kicker: string;
  listAriaLabel: string;
  photoAlt: string;
  problems: ProblemItem[];
  resolution: string;
  title: string;
};

export const USP_CHAT_AUTHORS = ["owner", "visitor"] as const;

export type UspChatAuthor = (typeof USP_CHAT_AUTHORS)[number];

type UspChatMessage = {
  author: UspChatAuthor;
  highlights?: string[];
  text: string;
};

type UspContent = {
  authorLabels: Record<UspChatAuthor, string>;
  chatAriaLabel: string;
  introMessage: UspChatMessage;
  messages: UspChatMessage[];
  replyCtaLabel: string;
  title: string;
};

export type HomeUiContent = {
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTag: string;
  heroTrustChips: string[];
  heroVisualAriaLabel: string;
  mappingWarning: string;
  processKicker: string;
  problemContent: ProblemContent;
  uspContent: UspContent;
  referencesLabels: ReferenceLabels;
  servicesFitLabel: string;
  servicesMoreItemsPluralLabel: string;
  servicesMoreItemsSingularLabel: string;
  servicesMoreAboutCtaPrefix: string;
  servicesMoreAboutLabels: {
    landing: string;
    process: string;
    upgrade: string;
    web: string;
  };
  servicesRecommendedBadgeLabel: string;
  servicesDeliveryLabel: string;
  servicesDetailPageCta: string;
  servicesKicker: string;
  servicesIntentOptions: ServiceOption[];
  servicesIntentTitle: string;
  servicesPrimaryCta: string;
  servicesPrimaryCtaLabels: {
    landing: string;
    maintenance: string;
    process: string;
    upgrade: string;
    web: string;
  };
};

const HOME_UI_CONTENT: Record<Locale, HomeUiContent> = {
  de: de as HomeUiContent,
  en: en as HomeUiContent,
};

export function getHomeUiContent(locale: Locale): HomeUiContent {
  return HOME_UI_CONTENT[locale];
}
