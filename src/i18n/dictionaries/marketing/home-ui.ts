import type { Locale } from "@/config/i18n";
import de from "./home-ui.de.json";
import en from "./home-ui.en.json";

type IncludedContent = {
  bridge?: string;
  cards: Array<{ description: string; tag: string; title: string }>;
  summaryPoints: string[];
  title: string;
};

export type HomeUiContent = {
  heroBenefitsAriaLabel: string;
  heroChipTags: string[];
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroTag: string;
  heroVisualAriaLabel: string;
  mappingWarning: string;
  servicesAddonBadgeLabel: string;
  servicesComingSoonExamplesCtaLabel: string;
  servicesComingSoonExamplesHideLabel: string;
  servicesComingSoonLabel: string;
  servicesFaqLinkLabel: string;
  servicesFitLabel: string;
  servicesMoreItemsPluralLabel: string;
  servicesMoreItemsSingularLabel: string;
  servicesOneTimeLabel: string;
  servicesRecommendedBadgeLabel: string;
  includedContent: IncludedContent;
  servicesDeliveryLabel: string;
  servicesDetailsCta: string;
  servicesPrimaryCta: string;
};

const HOME_UI_CONTENT: Record<Locale, HomeUiContent> = {
  de,
  en,
};

export function getHomeUiContent(locale: Locale): HomeUiContent {
  return HOME_UI_CONTENT[locale];
}
