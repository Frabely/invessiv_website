import type { Locale } from "@/config/i18n";
import type { ServiceOption } from "@/common/contracts/marketing";
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
  heroTrustChips: string[];
  heroVisualAriaLabel: string;
  leadBridgeContent: LeadBridgeContent;
  mappingWarning: string;
  proofHighlightsAriaLabel: string;
  proofRatingAriaLabel: string;
  proofReviewLinkLabel: string;
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
  de,
  en,
};

export function getHomeUiContent(locale: Locale): HomeUiContent {
  return HOME_UI_CONTENT[locale];
}
