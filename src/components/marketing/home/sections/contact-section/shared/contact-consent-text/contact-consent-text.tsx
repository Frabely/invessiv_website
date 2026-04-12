"use client";

import { ContactRequiredMarker } from "@/components/marketing/home/sections/contact-section/shared/contact-required-marker/contact-required-marker";
import styles from "./contact-consent-text.module.css";

type ContactConsentTextProps = {
  consentLabel: string;
  errorClassName: string;
  errorId: string;
  errorMessage?: string;
  privacyHref: string;
  privacyLabel: string;
};

export function ContactConsentText({
  consentLabel,
  errorClassName,
  errorId,
  errorMessage,
  privacyHref,
  privacyLabel,
}: ContactConsentTextProps) {
  return (
    <>
      <span className={styles.text}>
        {consentLabel}{" "}
        <a className={styles.link} href={privacyHref} target="_self">
          {privacyLabel}
        </a>
        <ContactRequiredMarker />
      </span>
      <p
        aria-hidden={errorMessage ? undefined : "true"}
        className={`${errorClassName}${errorMessage ? "" : ` ${styles.errorHidden}`}`}
        id={errorId}
        role={errorMessage ? "alert" : undefined}
      >
        {errorMessage ?? "\u00A0"}
      </p>
    </>
  );
}
