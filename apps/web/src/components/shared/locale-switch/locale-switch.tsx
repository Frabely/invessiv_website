"use client";

import type { MouseEvent } from "react";

import { SUPPORTED_LOCALES, type Locale } from "@/config/i18n";
import styles from "./locale-switch.module.css";

type LocaleSwitchProps = {
  className?: string;
  locale: Locale;
  localeMenuLabel: string;
  localeSwitchLabel: string;
  locales?: readonly Locale[];
  onSelectAction: (
    nextLocale: Locale,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  variant?: "desktop" | "mobile";
};

export function LocaleSwitch({
  className,
  locale,
  localeMenuLabel,
  localeSwitchLabel,
  locales = SUPPORTED_LOCALES,
  onSelectAction,
  variant = "desktop",
}: LocaleSwitchProps) {
  const rootClassName = className
    ? `${styles.root} ${styles[variant]} ${className}`
    : `${styles.root} ${styles[variant]}`;

  return (
    <details className={rootClassName}>
      <summary aria-label={localeMenuLabel} className={styles.summary}>
        <span aria-hidden="true" className={styles.icon}>
          <svg fill="none" viewBox="0 0 24 24">
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
            <path d="M3 12h18" />
            <path d="M12 3a15.5 15.5 0 0 1 0 18" />
            <path d="M12 3a15.5 15.5 0 0 0 0 18" />
          </svg>
        </span>
        <span className={styles.code}>{locale.toUpperCase()}</span>
      </summary>
      <div
        aria-label={localeSwitchLabel}
        className={styles.popover}
        role="group"
      >
        {locales.map((supportedLocale) => {
          const optionClassName =
            supportedLocale === locale
              ? `${styles.option} ${styles.optionActive}`
              : styles.option;

          return (
            <button
              className={optionClassName}
              key={supportedLocale}
              onClick={(event) => onSelectAction(supportedLocale, event)}
              type="button"
            >
              {supportedLocale.toUpperCase()}
            </button>
          );
        })}
      </div>
    </details>
  );
}
