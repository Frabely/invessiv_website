"use client";

import { useRef, type MouseEvent } from "react";
import { useDismissibleDetails } from "@/hooks/shared/use-dismissible-details";

import { SUPPORTED_LOCALES, type Locale } from "@/config/i18n";
import styles from "./locale-switch.module.css";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { ActionIcon } from "@/components/shared/action-icon/action-icon";

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
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  useDismissibleDetails(detailsRef);
  const rootClassName = className
    ? `${styles.root} ${styles[variant]} ${className}`
    : `${styles.root} ${styles[variant]}`;

  return (
    <details className={rootClassName} ref={detailsRef}>
      <summary aria-label={localeMenuLabel} className={styles.summary}>
        <span aria-hidden="true" className={styles.icon}>
          <ActionIcon icon={faGlobe} />
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
              <span className={styles.optionLabel}>
                {supportedLocale.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
