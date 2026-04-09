"use client";

import { ContactRequiredMarker } from "@/components/marketing/home/sections/contact-section/contact-required-marker";
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
      <span>
        {consentLabel}{" "}
        <a className={styles.link} href={privacyHref} target="_self">
          {privacyLabel}
        </a>
        <ContactRequiredMarker />
      </span>
      {errorMessage ? (
        <p className={errorClassName} id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </>
  );
}
