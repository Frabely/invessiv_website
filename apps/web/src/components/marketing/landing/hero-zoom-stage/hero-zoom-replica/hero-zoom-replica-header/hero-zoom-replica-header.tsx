import { SiteHeaderView } from "@/components/marketing/site-header/site-header-view";
import type { Locale } from "@/config/i18n";
import type { NavigationItem } from "@/config/navigation/home";
import { SECTION_HREFS } from "@/config/navigation/home";
import type { LandingHeaderContent } from "@/i18n/dictionaries/landing/header";

type HeroZoomReplicaHeaderProps = {
  ctaHref: string;
  locale: Locale;
  navigation: readonly NavigationItem[];
  uiContent: LandingHeaderContent;
};

export function HeroZoomReplicaHeader({
  ctaHref,
  locale,
  navigation,
  uiContent,
}: HeroZoomReplicaHeaderProps) {
  return (
    <SiteHeaderView
      brandHref={SECTION_HREFS.hero}
      ctaHref={ctaHref}
      locale={locale}
      mode="decorative"
      navigation={navigation}
      showThemeSwitch={false}
      uiContent={uiContent}
    />
  );
}
