"use client";

import { type MouseEvent, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { ReadingProgress } from "@/components/marketing/shared/reading-progress/reading-progress";
import type { NavigationItem } from "@/config/navigation/home";
import { SECTION_HREFS } from "@/config/navigation/home";
import {
  getSiteHeaderUiContent,
  type SiteHeaderUiContent,
} from "@/i18n/dictionaries/marketing/site-header-ui";
import { useMobileViewportHeight } from "@/hooks/marketing/use-mobile-viewport-height";
import { useScrolledHeader } from "@/hooks/marketing/use-scrolled-header";
import type { Locale } from "@/config/i18n";
import {
  createLocaleScrollRestoreState,
  LOCALE_SCROLL_RESTORE_STORAGE_KEY,
} from "@/lib/navigation/locale-scroll-restoration";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { createInternalNavigationUrl } from "@/lib/navigation/internal-navigation-url";
import {
  trackSiteHeaderLanguageSwitch,
  trackSiteHeaderThemeSwitch,
} from "@/lib/analytics/events/site-header-events";
import { getNextTheme } from "@/lib/theme/theme";
import { SiteHeaderView } from "./site-header-view";

type SiteHeaderContent = Omit<
  SiteHeaderUiContent,
  "skipLinkLabel" | "themeSwitch"
> & {
  themeSwitch?: SiteHeaderUiContent["themeSwitch"];
};

type SiteHeaderProps = {
  brandHref?: string;
  ctaHref?: string;
  isMinimalHeader?: boolean;
  navigation?: NavigationItem[];
  showThemeSwitch?: boolean;
  uiContent?: SiteHeaderContent;
};

export function SiteHeader({
  brandHref = SECTION_HREFS.hero,
  ctaHref = SECTION_HREFS.contact,
  isMinimalHeader = false,
  navigation = [],
  showThemeSwitch = true,
  uiContent,
}: SiteHeaderProps) {
  const { locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isScrolled = useScrolledHeader(14);
  useMobileViewportHeight();
  const ui = uiContent ?? getSiteHeaderUiContent(locale);
  const themeSwitchCopy = ui.themeSwitch
    ? theme === "dark"
      ? {
          actionLabel: ui.themeSwitch.actionLabel.dark,
        }
      : {
          actionLabel: ui.themeSwitch.actionLabel.light,
        }
    : undefined;

  const handleLocaleSelect = (
    nextLocale: Locale,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const localeMenu = event.currentTarget.closest("details");
    if (nextLocale === locale) {
      localeMenu?.removeAttribute("open");
      return;
    }

    const nextPathname = createLocalePathname(pathname, nextLocale);
    const search = typeof window !== "undefined" ? window.location.search : "";
    const nextUrl = createInternalNavigationUrl(nextPathname, search);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        LOCALE_SCROLL_RESTORE_STORAGE_KEY,
        createLocaleScrollRestoreState(nextUrl, window.scrollX, window.scrollY),
      );
    }

    trackSiteHeaderLanguageSwitch(nextLocale);
    setLocale(nextLocale);
    router.replace(nextUrl, { scroll: false });
    localeMenu?.removeAttribute("open");
  };
  const handleThemeToggle = () => {
    const nextTheme = getNextTheme(theme);
    trackSiteHeaderThemeSwitch(nextTheme);
    toggleTheme();
  };
  const handleMobileMenuLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget
      .closest<HTMLElement>(".site-header__mobile-menu")
      ?.removeAttribute("open");
  };

  useEffect(() => {
    const sanitizedUrl = createInternalNavigationUrl(
      window.location.pathname,
      window.location.search,
      window.location.hash,
    );
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (sanitizedUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", sanitizedUrl);
    }
  }, [pathname]);

  return (
    <SiteHeaderView
      brandHref={brandHref}
      ctaHref={ctaHref}
      isMinimalHeader={isMinimalHeader}
      isScrolled={isScrolled}
      locale={locale}
      navigation={navigation}
      onLocaleSelect={handleLocaleSelect}
      onMobileMenuLinkClick={handleMobileMenuLinkClick}
      onThemeToggle={handleThemeToggle}
      readingProgressSlot={<ReadingProgress />}
      showThemeSwitch={showThemeSwitch}
      theme={theme}
      themeSwitchCopy={themeSwitchCopy}
      uiContent={ui}
    />
  );
}
