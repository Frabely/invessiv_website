"use client";

import { faCommentDots } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { AnalyticsArea } from "@/common/constants/analytics/analytics-area";
import { AnalyticsCtaId } from "@/common/constants/analytics/analytics-cta-id";
import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import { getNavigationItem } from "@/lib/analytics/get-navigation-item";
import type { MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { ReadingProgress } from "@/components/marketing/shared/reading-progress/reading-progress";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { LocaleSwitch } from "@/components/shared/locale-switch/locale-switch";
import { ThemeSwitch } from "@/components/shared/theme-switch/theme-switch";
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
import {
  trackSiteHeaderLanguageSwitch,
  trackSiteHeaderThemeSwitch,
} from "@/lib/analytics/events/site-header-events";
import { getNextTheme } from "@/lib/theme/theme";
import styles from "./site-header.module.css";

type SiteHeaderContent = Omit<
  SiteHeaderUiContent,
  "skipLinkLabel" | "themeSwitch"
> & {
  themeSwitch?: SiteHeaderUiContent["themeSwitch"];
};

type SiteHeaderProps = {
  brandHref?: string;
  ctaAnalyticsTarget?: AnalyticsTarget;
  ctaHref?: string;
  isMinimalHeader?: boolean;
  navigation?: NavigationItem[];
  showThemeSwitch?: boolean;
  uiContent?: SiteHeaderContent;
};

export function SiteHeader({
  brandHref = SECTION_HREFS.hero,
  ctaAnalyticsTarget = AnalyticsTarget.ContactForm,
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
    const nextUrl = `${nextPathname}${search}`;

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

  const getLabelKey = (href: string) => {
    const hashIndex = href.indexOf("#");
    return hashIndex >= 0 ? href.slice(hashIndex) : href;
  };
  const ctaLabelKey = getLabelKey(ctaHref);
  const ctaAnalyticsAttributes = analyticsAttributes(
    AnalyticsEventName.CtaClicked,
    { cta: AnalyticsCtaId.HeaderPrimary, target: ctaAnalyticsTarget },
  );
  const getNavAnalyticsAttributes = (href: string, area: AnalyticsArea) =>
    analyticsAttributes(AnalyticsEventName.NavClicked, {
      item: getNavigationItem(href),
      area,
    });
  const mobileNavigation = navigation.filter(
    (item) => getLabelKey(item.href) !== ctaLabelKey,
  );
  const headerClassName = isScrolled
    ? `${styles.header} ${styles.headerScrolled} site-header is-scrolled`
    : `${styles.header} site-header`;

  return (
    <header className={headerClassName}>
      {isMinimalHeader ? null : <ReadingProgress />}
      <div className={`${styles.inner} site-header__inner`}>
        <a className={`${styles.brand} site-header__brand`} href={brandHref}>
          <Image
            src="/brand/icon.png"
            alt={ui.brandLogoAlt}
            width={26}
            height={26}
            priority
          />
          <span>{ui.brandLabel}</span>
        </a>

        {isMinimalHeader ? null : (
          <nav aria-label={ui.navAriaLabel} className={styles.desktopNav}>
            <ul className={styles.navList}>
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    className={styles.navLink}
                    href={item.href}
                    {...getNavAnalyticsAttributes(
                      item.href,
                      AnalyticsArea.Header,
                    )}
                  >
                    {ui.labelsByHref[getLabelKey(item.href)] ?? item.href}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div
          className={styles.actions}
          aria-label={isMinimalHeader ? undefined : ui.actionsAriaLabel}
        >
          {!isMinimalHeader && showThemeSwitch && themeSwitchCopy ? (
            <ThemeSwitch
              copy={themeSwitchCopy}
              onToggle={handleThemeToggle}
              theme={theme}
            />
          ) : null}
          <LocaleSwitch
            locale={locale}
            localeMenuLabel={ui.localeMenuLabel}
            localeSwitchLabel={ui.localeSwitchLabel}
            onSelectAction={handleLocaleSelect}
            variant="desktop"
          />
          {isMinimalHeader ? null : (
            <PrimaryCtaLink
              className={styles.navCta}
              href={ctaHref}
              {...ctaAnalyticsAttributes}
            >
              {ui.ctaLabel}
            </PrimaryCtaLink>
          )}
        </div>

        <div className={styles.mobileActions}>
          <LocaleSwitch
            locale={locale}
            localeMenuLabel={ui.localeMenuLabel}
            localeSwitchLabel={ui.localeSwitchLabel}
            onSelectAction={handleLocaleSelect}
            variant="mobile"
          />
          {isMinimalHeader ? null : (
            <>
              <PrimaryCtaLink
                aria-label={ui.ctaLabel}
                className={`${styles.navCta} ${styles.mobileCta}`}
                href={ctaHref}
                title={ui.ctaLabel}
                {...ctaAnalyticsAttributes}
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  className={styles.mobileCtaIcon}
                  icon={faCommentDots}
                />
                <span className="sr-only">{ui.ctaLabel}</span>
              </PrimaryCtaLink>
              <details
                className={`${styles.mobileMenu} site-header__mobile-menu`}
              >
                <summary
                  aria-label={ui.mobileMenuLabel}
                  className={styles.mobileMenuSummary}
                >
                  <span className="sr-only">{ui.mobileMenuLabel}</span>
                  <span aria-hidden="true" className={styles.mobileMenuIcon}>
                    <span className={styles.mobileMenuIconLine} />
                    <span className={styles.mobileMenuIconLine} />
                    <span className={styles.mobileMenuIconLine} />
                  </span>
                </summary>
                <ul className={styles.mobileMenuList}>
                  {showThemeSwitch && themeSwitchCopy ? (
                    <li className={styles.mobileMenuListItem}>
                      <ThemeSwitch
                        copy={themeSwitchCopy}
                        onToggle={handleThemeToggle}
                        theme={theme}
                        variant="mobile"
                      />
                    </li>
                  ) : null}
                  {mobileNavigation.map((item) => (
                    <li className={styles.mobileMenuListItem} key={item.href}>
                      <a
                        className={styles.mobileMenuLink}
                        href={item.href}
                        onClick={handleMobileMenuLinkClick}
                        {...getNavAnalyticsAttributes(
                          item.href,
                          AnalyticsArea.HeaderMobile,
                        )}
                      >
                        {ui.labelsByHref[getLabelKey(item.href)] ?? item.href}
                      </a>
                    </li>
                  ))}
                  <li className={styles.mobileMenuListItem}>
                    <PrimaryCtaLink
                      className={styles.mobileMenuCta}
                      href={ctaHref}
                      onClick={handleMobileMenuLinkClick}
                      {...ctaAnalyticsAttributes}
                    >
                      {ui.ctaLabel}
                    </PrimaryCtaLink>
                  </li>
                </ul>
              </details>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
