"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { ConsentSettings } from "@/components/consent/consent-banner/consent-settings/consent-settings";
import { SITE_ROUTES } from "@/config/routes";
import { useConsent } from "@/hooks/consent/use-consent";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import styles from "./consent-banner.module.css";

export function ConsentBanner() {
  const {
    content,
    locale,
    isSettingsOpen,
    acceptAll,
    rejectAll,
    openSettings,
    closeSettings,
    dismissBanner,
  } = useConsent();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const privacyHref = createLocalePathname(SITE_ROUTES.PRIVACY, locale);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (isSettingsOpen) {
        closeSettings();
        return;
      }
      dismissBanner();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSettingsOpen, closeSettings, dismissBanner]);

  return (
    <div className={styles.root}>
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className={styles.intro}>
          <h2 className={styles.title} id={titleId}>
            {content.banner.title}
          </h2>
          <p className={styles.description} id={descriptionId}>
            {content.banner.description}{" "}
            <Link className={styles.privacyLink} href={privacyHref}>
              {content.banner.privacyLabel}
            </Link>
          </p>
        </div>

        {isSettingsOpen ? <ConsentSettings /> : null}

        <div className={styles.actions}>
          <button className={styles.decision} onClick={acceptAll} type="button">
            {content.banner.acceptAll}
          </button>
          <button className={styles.decision} onClick={rejectAll} type="button">
            {content.banner.reject}
          </button>
          {isSettingsOpen ? null : (
            <button
              className={styles.settings}
              onClick={openSettings}
              type="button"
            >
              {content.banner.settings}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
