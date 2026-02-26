"use client";

import Image from "next/image";
import { useLanguage } from "@/components/providers/language-provider";
import { ENABLE_THEME_SWITCH } from "@/config/site";
import { getSiteHeaderUiContent } from "@/content/marketing/site-header-ui";
import { useScrolledHeader } from "@/hooks/marketing/use-scrolled-header";
import type { NavigationItem } from "@/config/site";

type SiteHeaderProps = {
  navigation: NavigationItem[];
};

export function SiteHeader({ navigation }: SiteHeaderProps) {
  const { locale, setLocale, theme, toggleTheme } = useLanguage();
  const isScrolled = useScrolledHeader(14);
  const ui = getSiteHeaderUiContent(locale);
  const themeToggleLabel =
    theme === "dark" ? ui.themeToggleLabel.dark : ui.themeToggleLabel.light;
  return (
    <header className={`site-header${isScrolled ? " is-scrolled" : ""}`}>
      <div className="site-header__inner">
        <a className="site-header__brand" href="#hero">
          <Image
            src="/brand/icon.png"
            alt="Invessiv Logo"
            width={26}
            height={26}
            priority
          />
          <span>Invessiv</span>
        </a>

        <nav aria-label="Primary" className="site-header__desktop-nav">
          <ul className="site-header__nav">
            {navigation.map((item) => (
              <li key={item.href}>
                <a href={item.href}>
                  {ui.labelsByHref[item.href] ?? item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div
          className="site-header__actions"
          aria-label="Language and primary action"
        >
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
              <span className="site-header__locale-code">{locale.toUpperCase()}</span>
            </summary>
            <div
              aria-label={ui.localeSwitchLabel}
              className="site-header__locale-popover"
              role="group"
            >
              <button
                className={`site-header__locale-option${locale === "de" ? " is-active" : ""}`}
                onClick={() => setLocale("de")}
                type="button"
              >
                DE
              </button>
              <button
                className={`site-header__locale-option${locale === "en" ? " is-active" : ""}`}
                onClick={() => setLocale("en")}
                type="button"
              >
                EN
              </button>
            </div>
          </details>
          <a className="menu-cta" href="#contact">
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
              <span className="site-header__locale-code">{locale.toUpperCase()}</span>
            </summary>
            <div
              aria-label={ui.localeSwitchLabel}
              className="site-header__locale-popover"
              role="group"
            >
              <button
                className={`site-header__locale-option${locale === "de" ? " is-active" : ""}`}
                onClick={() => setLocale("de")}
                type="button"
              >
                DE
              </button>
              <button
                className={`site-header__locale-option${locale === "en" ? " is-active" : ""}`}
                onClick={() => setLocale("en")}
                type="button"
              >
                EN
              </button>
            </div>
          </details>
          <a
            aria-label={ui.ctaLabel}
            className="menu-cta site-header__mobile-cta"
            href="#contact"
            title={ui.ctaLabel}
          >
            <span aria-hidden="true" className="site-header__mobile-cta-icon">
              <svg fill="none" viewBox="0 0 24 24">
                <path d="M7.5 19.5 3 21l1.5-4.5" />
                <path d="M7.5 19.5a9 9 0 1 0-3-6.72" />
                <circle cx="9.75" cy="12" fill="currentColor" r="0.9" stroke="none" />
                <circle cx="12.75" cy="12" fill="currentColor" r="0.9" stroke="none" />
                <circle cx="15.75" cy="12" fill="currentColor" r="0.9" stroke="none" />
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
              {navigation.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>
                    {ui.labelsByHref[item.href] ?? item.label}
                  </a>
                </li>
              ))}
              <li>
                <a className="mobile-menu-cta" href="#contact">
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
