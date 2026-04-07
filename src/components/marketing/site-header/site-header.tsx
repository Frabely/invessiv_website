"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { LocaleSwitch } from "@/components/shared/locale-switch/locale-switch";
import { ThemeSwitch } from "@/components/shared/theme-switch/theme-switch";
import { SECTION_HREFS } from "@/config/site";
import { getSiteHeaderUiContent } from "@/i18n/dictionaries/marketing/site-header-ui";
import { useMobileViewportHeight } from "@/hooks/marketing/use-mobile-viewport-height";
import { useScrolledHeader } from "@/hooks/marketing/use-scrolled-header";
import type { NavigationItem } from "@/config/site";
import type { Locale } from "@/config/i18n";
import {
  createLocaleScrollRestoreState,
  LOCALE_SCROLL_RESTORE_STORAGE_KEY,
} from "@/lib/navigation/locale-scroll-restoration";
import styles from "./site-header.module.css";

type SiteHeaderProps = {
  brandHref?: string;
  ctaHref?: string;
  navigation: NavigationItem[];
};

export function SiteHeader({
  brandHref = SECTION_HREFS.hero,
  ctaHref = SECTION_HREFS.contact,
  navigation,
}: SiteHeaderProps) {
  const { locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isScrolled = useScrolledHeader(14);
  useMobileViewportHeight();
  const ui = getSiteHeaderUiContent(locale);
  const themeSwitchCopy =
    theme === "dark"
      ? {
          actionLabel: ui.themeSwitch.actionLabel.dark,
        }
      : {
          actionLabel: ui.themeSwitch.actionLabel.light,
        };

  const handleLocaleSelect = (
    nextLocale: Locale,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const normalizedPath = pathname || "/";
    const nextPathname = (() => {
      if (normalizedPath === "/") {
        return `/${nextLocale}`;
      }
      const segments = normalizedPath.split("/").filter(Boolean);
      if (segments[0] === "de" || segments[0] === "en") {
        segments[0] = nextLocale;
        return `/${segments.join("/")}`;
      }
      return `/${nextLocale}${normalizedPath}`;
    })();
    const search = typeof window !== "undefined" ? window.location.search : "";
    const nextUrl = `${nextPathname}${search}`;

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        LOCALE_SCROLL_RESTORE_STORAGE_KEY,
        createLocaleScrollRestoreState(nextUrl, window.scrollX, window.scrollY),
      );
    }

    setLocale(nextLocale);
    router.replace(nextUrl, { scroll: false });
    event.currentTarget.closest("details")?.removeAttribute("open");
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
  const mobileNavigation = navigation.filter(
    (item) => getLabelKey(item.href) !== SECTION_HREFS.contact,
  );
  const headerClassName = isScrolled
    ? `${styles.header} ${styles.headerScrolled} site-header is-scrolled`
    : `${styles.header} site-header`;

  return (
    <header className={headerClassName}>
      <div className={`${styles.inner} site-header__inner`}>
        <a className={`${styles.brand} site-header__brand`} href={brandHref}>
          <Image
            src="/brand/icon.png"
            alt={ui.brandLogoAlt}
            width={26}
            height={26}
            priority
          />
          <span>Invessiv</span>
        </a>

        <nav aria-label={ui.navAriaLabel} className={styles.desktopNav}>
          <ul className={styles.navList}>
            {navigation.map((item) => (
              <li key={item.href}>
                <a className={styles.navLink} href={item.href}>
                  {ui.labelsByHref[getLabelKey(item.href)] ?? item.href}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions} aria-label={ui.actionsAriaLabel}>
          <ThemeSwitch
            copy={themeSwitchCopy}
            onToggle={toggleTheme}
            theme={theme}
          />
          <LocaleSwitch
            locale={locale}
            localeMenuLabel={ui.localeMenuLabel}
            localeSwitchLabel={ui.localeSwitchLabel}
            onSelect={handleLocaleSelect}
            variant="desktop"
          />
          <PrimaryCtaLink
            className={styles.navCta}
            href={ctaHref}
            data-analytics-event="cta_click"
            data-analytics-location="nav"
            data-analytics-variant="primary"
            data-analytics-target="form"
          >
            {ui.ctaLabel}
          </PrimaryCtaLink>
        </div>

        <div className={styles.mobileActions}>
          <LocaleSwitch
            locale={locale}
            localeMenuLabel={ui.localeMenuLabel}
            localeSwitchLabel={ui.localeSwitchLabel}
            onSelect={handleLocaleSelect}
            variant="mobile"
          />
          <PrimaryCtaLink
            aria-label={ui.ctaLabel}
            className={`${styles.navCta} ${styles.mobileCta}`}
            href={ctaHref}
            title={ui.ctaLabel}
            data-analytics-event="cta_click"
            data-analytics-location="nav"
            data-analytics-variant="primary"
            data-analytics-target="form"
          >
            <span aria-hidden="true" className={styles.mobileCtaIcon}>
              <svg fill="none" viewBox="0 0 24 24">
                <path d="M7.5 19.5 3 21l1.5-4.5" />
                <path d="M7.5 19.5a9 9 0 1 0-3-6.72" />
                <circle
                  cx="9.75"
                  cy="12"
                  fill="currentColor"
                  r="0.9"
                  stroke="none"
                />
                <circle
                  cx="12.75"
                  cy="12"
                  fill="currentColor"
                  r="0.9"
                  stroke="none"
                />
                <circle
                  cx="15.75"
                  cy="12"
                  fill="currentColor"
                  r="0.9"
                  stroke="none"
                />
              </svg>
            </span>
            <span className="sr-only">{ui.ctaLabel}</span>
          </PrimaryCtaLink>
          <details className={`${styles.mobileMenu} site-header__mobile-menu`}>
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
              <li className={styles.mobileMenuListItem}>
                <ThemeSwitch
                  copy={themeSwitchCopy}
                  onToggle={toggleTheme}
                  theme={theme}
                  variant="mobile"
                />
              </li>
              {mobileNavigation.map((item) => (
                <li className={styles.mobileMenuListItem} key={item.href}>
                  <a
                    className={styles.mobileMenuLink}
                    href={item.href}
                    onClick={handleMobileMenuLinkClick}
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
                  data-analytics-event="cta_click"
                  data-analytics-location="nav"
                  data-analytics-variant="primary"
                  data-analytics-target="form"
                >
                  {ui.ctaLabel}
                </PrimaryCtaLink>
              </li>
            </ul>
          </details>
        </div>
      </div>
    </header>
  );
}
