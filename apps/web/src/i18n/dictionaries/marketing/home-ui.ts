import type { Locale } from "@/config/i18n";
import de from "./home-ui.de.json";
import en from "./home-ui.en.json";

type LeadBridgeContent = {
  bridge: string;
  kicker: string;
  signalAriaLabel: string;
  summaryPoints: string[];
  title: string;
};

export type HomeUiContent = {
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTag: string;
  heroVisualAriaLabel: string;
  leadBridgeContent: LeadBridgeContent;
  mappingWarning: string;
  proofHighlightsAriaLabel: string;
  proofRatingAriaLabel: string;
  proofReviewLinkLabel: string;
  servicesAddonBadgeLabel: string;
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
  servicesDetailsCta: string;
  servicesKicker: string;
  servicesLaunchAddonTitle: string;
  servicesOtherTitle: string;
  servicesIntentOptions: Array<{
    key: string;
    label: string;
    serviceKey?: string;
  }>;
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
  de,
  en,
};

export function getHomeUiContent(locale: Locale): HomeUiContent {
  return HOME_UI_CONTENT[locale];
}
