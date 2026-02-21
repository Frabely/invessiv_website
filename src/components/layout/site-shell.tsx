"use client";

import Link from "next/link";
import { useState } from "react";
import { Locale } from "@/config/i18n";
import { ThemeToggle } from "@/components/preferences/theme-toggle";
import { LocaleSwitcher } from "@/components/preferences/locale-switcher";
import { SiteDictionary } from "@/content/i18n/types";
import { siteConfig } from "@/config/site";

export function SiteHeader(props: { locale: Locale; dictionary: SiteDictionary }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] w-full max-w-[1080px] items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-[var(--color-foreground)]"
        >
          <span className="h-[34px] w-[34px] rounded-[10px] bg-[linear-gradient(145deg,var(--brand),var(--accent))] shadow-[0_10px_24px_rgba(20,184,166,0.34)]" />
          <span>{siteConfig.name}</span>
        </Link>

        <div className="flex items-center gap-2">
          <nav
            aria-label="Hauptnavigation"
            className="hidden gap-2 text-sm font-bold text-[var(--color-muted-foreground)] md:flex"
          >
            {props.dictionary.navigation.main.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[10px] border border-transparent px-2.5 py-2 transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <LocaleSwitcher
              label={props.dictionary.preferences.language.label}
              deLabel={props.dictionary.preferences.language.de}
              enLabel={props.dictionary.preferences.language.en}
              activeLocale={props.locale}
            />
            <ThemeToggle
              label={props.dictionary.preferences.theme.label}
              lightLabel={props.dictionary.preferences.theme.light}
              darkLabel={props.dictionary.preferences.theme.dark}
            />
          </div>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px] md:hidden"
          >
            Menu
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 md:hidden"
        >
          <div className="mx-auto grid w-full max-w-[1080px] gap-2 px-4 py-3">
            {props.dictionary.navigation.main.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm font-bold text-[var(--color-muted-foreground)]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-1 flex items-center justify-between gap-2">
              <LocaleSwitcher
                label={props.dictionary.preferences.language.label}
                deLabel={props.dictionary.preferences.language.de}
                enLabel={props.dictionary.preferences.language.en}
                activeLocale={props.locale}
              />
              <ThemeToggle
                label={props.dictionary.preferences.theme.label}
                lightLabel={props.dictionary.preferences.theme.light}
                darkLabel={props.dictionary.preferences.theme.dark}
              />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter(props: { dictionary: SiteDictionary }) {
  return (
    <footer className="mt-5 border-t border-[var(--color-border)]">
      <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
        <nav aria-label="Rechtliche Navigation" className="flex flex-wrap gap-2">
          {props.dictionary.navigation.legal.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--color-surface-muted)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
