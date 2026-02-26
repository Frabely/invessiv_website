"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/config/i18n";
import { SUPPORTED_LOCALES } from "@/config/i18n";
import { getSiteHeaderUiContent } from "@/content/marketing/site-header-ui";

type LegalSlug = "imprint" | "privacy" | "terms";

type LegalLanguageSwitchProps = {
  locale: Locale;
  slug: LegalSlug;
};

export function LegalLanguageSwitch({ locale, slug }: LegalLanguageSwitchProps) {
  const router = useRouter();
  const ui = getSiteHeaderUiContent(locale);

  const handleLocaleSelect = (
    nextLocale: Locale,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.currentTarget.closest("details")?.removeAttribute("open");
    if (nextLocale !== locale) {
      router.push(`/${nextLocale}/${slug}`);
    }
  };

  return (
    <details className="site-header__locale site-header__locale--desktop legal-lang-switch">
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
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <button
            key={supportedLocale}
            className={`site-header__locale-option${supportedLocale === locale ? " is-active" : ""}`}
            onClick={(event) => handleLocaleSelect(supportedLocale, event)}
            type="button"
          >
            {supportedLocale.toUpperCase()}
          </button>
        ))}
      </div>
    </details>
  );
}
