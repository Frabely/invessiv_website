import Link from "next/link";
import type { Locale } from "@/config/i18n";
import { SUPPORTED_LOCALES } from "@/config/i18n";

type LegalSlug = "imprint" | "privacy" | "terms";

type LegalLanguageSwitchProps = {
  locale: Locale;
  slug: LegalSlug;
};

export function LegalLanguageSwitch({ locale, slug }: LegalLanguageSwitchProps) {
  return (
    <nav
      aria-label={locale === "de" ? "Sprache wechseln" : "Switch language"}
      className="legal-lang-switch"
    >
      {SUPPORTED_LOCALES.map((supportedLocale) => (
        <Link
          key={supportedLocale}
          className={`legal-lang-switch__link${supportedLocale === locale ? " is-active" : ""}`}
          href={`/${supportedLocale}/${slug}`}
          hrefLang={supportedLocale}
          lang={supportedLocale}
        >
          {supportedLocale.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
