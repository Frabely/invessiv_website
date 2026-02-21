import Link from "next/link";
import { Locale } from "@/config/i18n";
import { ThemeToggle } from "@/components/preferences/theme-toggle";
import { LocaleSwitcher } from "@/components/preferences/locale-switcher";
import { SiteDictionary } from "@/content/i18n/types";
import { siteConfig } from "@/config/site";

export function SiteHeader(props: { locale: Locale; dictionary: SiteDictionary }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight text-[var(--color-foreground)]"
        >
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-3">
          <nav
            aria-label="Hauptnavigation"
            className="hidden gap-5 text-sm font-semibold text-[var(--color-muted-foreground)] md:flex"
          >
            {props.dictionary.navigation.main.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-[var(--color-foreground)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
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
    </header>
  );
}

export function SiteFooter(props: { dictionary: SiteDictionary }) {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
        <nav aria-label="Rechtliche Navigation" className="flex gap-4">
          {props.dictionary.navigation.legal.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="underline-offset-4 hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
