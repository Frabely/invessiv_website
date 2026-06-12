"use client";

import { useConsent } from "@/hooks/consent/use-consent";
import styles from "./cookie-settings-button.module.css";

export function CookieSettingsButton() {
  const { content, openSettings } = useConsent();

  return (
    <button className={styles.button} onClick={openSettings} type="button">
      {content.cookieSettingsLabel}
    </button>
  );
}
