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
    if (nextLocale === locale) {
      return;
    }
    router.push(`/${nextLocale}/${slug}`);
    event.currentTarget.blur();
  };

  return (
    <div
      aria-label={ui.localeSwitchLabel}
      className="site-header__locale-popover legal-lang-switch"
      role="group"
    >
      {SUPPORTED_LOCALES.map((supportedLocale) => (
        <button
          key={supportedLocale}
          aria-pressed={supportedLocale === locale}
          className={`site-header__locale-option${supportedLocale === locale ? " is-active" : ""}`}
          onClick={(event) => handleLocaleSelect(supportedLocale, event)}
          type="button"
        >
          {supportedLocale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
