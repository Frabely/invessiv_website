"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/language-provider";
import { ENABLE_THEME_SWITCH, SECTION_HREFS } from "@/config/site";
import { getSiteHeaderUiContent } from "@/i18n/dictionaries/marketing/site-header-ui";
import { useMobileViewportHeight } from "@/hooks/marketing/use-mobile-viewport-height";
import { useScrolledHeader } from "@/hooks/marketing/use-scrolled-header";
import type { NavigationItem } from "@/config/site";
import type { Locale } from "@/config/i18n";
import {
  createLocaleScrollRestoreState,
  LOCALE_SCROLL_RESTORE_STORAGE_KEY,
} from "@/lib/navigation/locale-scroll-restoration";

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
  const { locale, setLocale, theme, toggleTheme } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const isScrolled = useScrolledHeader(14);
  useMobileViewportHeight();
  const ui = getSiteHeaderUiContent(locale);
  const themeToggleLabel =
    theme === "dark" ? ui.themeToggleLabel.dark : ui.themeToggleLabel.light;

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
  const getLocaleOptionClassName = (targetLocale: Locale) => {
    if (locale === targetLocale) {
      return "site-header__locale-option is-active";
    }
    return "site-header__locale-option";
  };
  const mobileNavigation = navigation.filter(
    (item) => getLabelKey(item.href) !== SECTION_HREFS.contact,
  );

  return (
    <header className={`site-header${isScrolled ? " is-scrolled" : ""}`}>
      <div className="site-header__inner">
        <a className="site-header__brand" href={brandHref}>
          <Image
            src="/brand/icon.png"
            alt={ui.brandLogoAlt}
            width={26}
            height={26}
            priority
          />
          <span>Invessiv</span>
        </a>

        <nav aria-label={ui.navAriaLabel} className="site-header__desktop-nav">
          <ul className="site-header__nav">
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href}>
                  {ui.labelsByHref[getLabelKey(item.href)] ?? item.href}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions" aria-label={ui.actionsAriaLabel}>
          {ENABLE_THEME_SWITCH ? (
            <button
              className="theme-switch"
              onClick={toggleTheme}
              type="button"
            >
              {themeToggleLabel}
            </button>
          ) : null}
          <details className="site-header__locale site-header__locale--desktop">
            <summary aria-label={ui.localeMenuLabel}>
              <span aria-hidden="true" className="site-header__locale-icon">
                <svg fill="none" viewBox="0 0 24 24">
                  <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                  <path d="M3 12h18" />
                  <path d="M12 3a15.5 15.5 0 0 1 0 18" />
                  <path d="M12 3a15.5 15.5 0 0 0 0 18" />
                </svg>
              </span>
              <span className="site-header__locale-code">
                {locale.toUpperCase()}
              </span>
            </summary>
            <div
              aria-label={ui.localeSwitchLabel}
              className="site-header__locale-popover"
              role="group"
            >
              <button
                className={getLocaleOptionClassName("de")}
                onClick={(event) => handleLocaleSelect("de", event)}
                type="button"
              >
                DE
              </button>
              <button
                className={getLocaleOptionClassName("en")}
                onClick={(event) => handleLocaleSelect("en", event)}
                type="button"
              >
                EN
              </button>
            </div>
          </details>
          <a
            className="menu-cta"
            href={ctaHref}
            data-analytics-event="cta_click"
            data-analytics-location="nav"
            data-analytics-variant="primary"
            data-analytics-target="form"
          >
            {ui.ctaLabel}
          </a>
        </div>

        <div className="site-header__mobile-actions">
          <details className="site-header__locale site-header__locale--mobile">
            <summary aria-label={ui.localeMenuLabel}>
              <span aria-hidden="true" className="site-header__locale-icon">
                <svg fill="none" viewBox="0 0 24 24">
                  <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                  <path d="M3 12h18" />
                  <path d="M12 3a15.5 15.5 0 0 1 0 18" />
                  <path d="M12 3a15.5 15.5 0 0 0 0 18" />
                </svg>
              </span>
              <span className="site-header__locale-code">
                {locale.toUpperCase()}
              </span>
            </summary>
            <div
              aria-label={ui.localeSwitchLabel}
              className="site-header__locale-popover"
              role="group"
            >
              <button
                className={getLocaleOptionClassName("de")}
                onClick={(event) => handleLocaleSelect("de", event)}
                type="button"
              >
                DE
              </button>
              <button
                className={getLocaleOptionClassName("en")}
                onClick={(event) => handleLocaleSelect("en", event)}
                type="button"
              >
                EN
              </button>
            </div>
          </details>
          <a
            aria-label={ui.ctaLabel}
            className="menu-cta site-header__mobile-cta"
            href={ctaHref}
            title={ui.ctaLabel}
            data-analytics-event="cta_click"
            data-analytics-location="nav"
            data-analytics-variant="primary"
            data-analytics-target="form"
          >
            <span aria-hidden="true" className="site-header__mobile-cta-icon">
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
          </a>
          <details className="site-header__mobile-menu">
            <summary aria-label={ui.mobileMenuLabel}>
              <span className="sr-only">{ui.mobileMenuLabel}</span>
              <span aria-hidden="true" className="mobile-menu-icon">
                <span />
                <span />
                <span />
              </span>
            </summary>
            <ul>
              {ENABLE_THEME_SWITCH ? (
                <li>
                  <button
                    className="theme-switch theme-switch--mobile"
                    onClick={toggleTheme}
                    type="button"
                  >
                    {themeToggleLabel}
                  </button>
                </li>
              ) : null}
              {mobileNavigation.map((item) => (
                <li key={item.href}>
                  <a href={item.href} onClick={handleMobileMenuLinkClick}>
                    {ui.labelsByHref[getLabelKey(item.href)] ?? item.href}
                  </a>
                </li>
              ))}
              <li>
                <a
                  className="mobile-menu-cta"
                  href={ctaHref}
                  onClick={handleMobileMenuLinkClick}
                  data-analytics-event="cta_click"
                  data-analytics-location="nav"
                  data-analytics-variant="primary"
                  data-analytics-target="form"
                >
                  {ui.ctaLabel}
                </a>
              </li>
            </ul>
          </details>
        </div>
      </div>
    </header>
  );
}
