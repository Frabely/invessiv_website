"use client";

import { useRef, type MouseEvent } from "react";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import {
  SUPPORTED_LOCALES,
  type Locale,
} from "@invessiv/common/contracts/i18n/locale";
import {
  HeaderControlVariant,
  type HeaderControlVariant as HeaderControlVariantValue,
} from "@invessiv/common/constants/ui/header-control-variants";
import { useDismissibleDetails } from "../../hooks/use-dismissible-details";
import { ActionIcon } from "../action-icon/action-icon";
import styles from "./locale-switch.module.css";

export type LocaleSwitchProps = {
  className?: string;
  locale: Locale;
  localeMenuLabel: string;
  localeSwitchLabel: string;
  locales?: readonly Locale[];
  onSelectAction: (
    nextLocale: Locale,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  variant?: HeaderControlVariantValue;
};

export function LocaleSwitch({
  className,
  locale,
  localeMenuLabel,
  localeSwitchLabel,
  locales = SUPPORTED_LOCALES,
  onSelectAction,
  variant = HeaderControlVariant.Desktop,
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
