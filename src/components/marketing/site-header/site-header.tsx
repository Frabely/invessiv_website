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
            src="/brand/icon.svg"
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
          <div
            aria-label="Language switch"
            className="lang-switch"
            role="group"
          >
            <button
              className={`lang-switch__option${locale === "de" ? " is-active" : ""}`}
              onClick={() => setLocale("de")}
              type="button"
            >
              DE
            </button>
            <button
              className={`lang-switch__option${locale === "en" ? " is-active" : ""}`}
              onClick={() => setLocale("en")}
              type="button"
            >
              EN
            </button>
          </div>
          <a className="menu-cta" href="#contact">
            {ui.ctaLabel}
          </a>
        </div>

        <details className="site-header__mobile-menu">
          <summary>{ui.mobileMenuLabel}</summary>
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
    </header>
  );
}
