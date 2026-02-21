"use client";

import Link from "next/link";
import Image from "next/image";
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
          className="flex items-center gap-2"
        >
          <span className="relative h-[38px] w-[172px] overflow-hidden rounded-md">
            <Image
              src="/logo2.png"
              alt={siteConfig.name}
              fill
              className="object-contain object-center [clip-path:inset(4%_0_18%_0)]"
              sizes="172px"
              priority
            />
          </span>
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
            <button
              type="button"
              className="rounded-xl border border-[color:rgba(245,158,11,0.48)] bg-[linear-gradient(140deg,rgba(245,158,11,0.2),rgba(180,83,9,0.25))] px-3 py-2 text-xs font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px]"
            >
              {props.dictionary.actions.login}
            </button>
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
            <Link
              href="https://calendly.com/"
              className="rounded-xl border border-[color:rgba(20,184,166,0.55)] bg-[linear-gradient(140deg,rgba(20,184,166,0.35),rgba(15,118,110,0.42))] px-3 py-2 text-xs font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px]"
            >
              {props.dictionary.actions.call}
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-extrabold text-[var(--color-foreground)] transition hover:-translate-y-[1px] md:hidden"
          >
            {props.dictionary.actions.menu}
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
          (c) {new Date().getFullYear()} {siteConfig.name}
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
