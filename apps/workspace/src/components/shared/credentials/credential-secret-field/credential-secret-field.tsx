"use client";

import { useState } from "react";
import {
  faCheck,
  faCopy,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { RevealedSecretStatus } from "@/common/constants/credentials/revealed-secret-status";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import type { CredentialSecretFieldLabels } from "@/common/contracts/credentials/credential-secret-field-labels";
import { useRevealedSecret } from "@/hooks/shared/use-revealed-secret";
import styles from "./credential-secret-field.module.css";

export type CredentialSecretFieldProps = {
  autoHideSeconds: number;
  /** Without it the field is a mask and nothing else: no action is rendered at all. */
  canReveal: boolean;
  /** Keeps the actions in place but inert, e.g. while encryption is not set up. */
  disabled?: boolean;
  labels: CredentialSecretFieldLabels;
  /** Keeps line breaks of a revealed note. */
  multiline?: boolean;
  /** Names the value for assistive technology, e.g. "Password of Hosting". */
  name: string;
  onRevealAction: (
    intent: CredentialRevealIntent,
  ) => Promise<CredentialRevealOutcome>;
};

// A fixed length: the mask must not hint at how long the value is.
const MASK = "••••••••••••";

/**
 * One secret value that is requested only when asked for. It knows no endpoint and no dictionary;
 * the owner passes texts and the reveal function, so CRM and portal share it.
 */
export function CredentialSecretField({
  autoHideSeconds,
  canReveal,
  disabled = false,
  labels,
  multiline = false,
  name,
  onRevealAction,
}: CredentialSecretFieldProps) {
  const secret = useRevealedSecret({
    autoHideSeconds,
    clipboardFailedMessage: labels.clipboardFailed,
    reveal: onRevealAction,
  });
  const [wasShown, setWasShown] = useState(false);
  const isVisible = secret.status === RevealedSecretStatus.Visible;
  const isLoading = secret.status === RevealedSecretStatus.Loading;
  const named = { name };

  // Announces the state, never the value. The seconds are the full span, so the text does not
  // change every second and is read exactly once.
  const announcement = secret.copied
    ? formatMessage(labels.copiedAnnouncement, named)
    : isVisible
      ? formatMessage(labels.visibleAnnouncement, {
          name,
          seconds: autoHideSeconds,
        })
      : wasShown && secret.status === RevealedSecretStatus.Hidden
        ? formatMessage(labels.hiddenAnnouncement, named)
        : "";

  function toggle() {
    if (isVisible) {
      secret.hide();
      return;
    }
    setWasShown(true);
    void secret.show();
  }

  function copy() {
    if (!isVisible) setWasShown(false);
    void secret.copy();
  }

  return (
    <div className={styles.field}>
      <div
        className={styles.value}
        data-multiline={multiline ? "true" : "false"}
        data-visible={isVisible ? "true" : "false"}
      >
        {isVisible ? (
          <span className={styles.plain}>{secret.value}</span>
        ) : (
          <>
            <span aria-hidden="true" className={styles.mask}>
              {MASK}
            </span>
            <span className="sr-only">{labels.masked}</span>
          </>
        )}
      </div>
      {canReveal ? (
        <div className={styles.actions}>
          <button
            aria-label={formatMessage(
              isVisible ? labels.hideNamed : labels.showNamed,
              named,
            )}
            className={styles.action}
            disabled={disabled || isLoading}
            onClick={toggle}
            type="button"
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={isVisible ? faEyeSlash : faEye}
            />
            <span>
              {isLoading
                ? labels.loading
                : isVisible
                  ? labels.hide
                  : labels.show}
            </span>
          </button>
          <button
            aria-label={formatMessage(labels.copyNamed, named)}
            className={styles.action}
            data-copied={secret.copied ? "true" : "false"}
            disabled={disabled}
            onClick={copy}
            type="button"
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={secret.copied ? faCheck : faCopy}
            />
            <span>{secret.copied ? labels.copied : labels.copy}</span>
          </button>
        </div>
      ) : null}
      {isVisible ? (
        <div aria-hidden="true" className={styles.timer}>
          <progress
            className={styles.progress}
            max={autoHideSeconds}
            value={secret.secondsLeft}
          />
          <span className={styles.countdown}>
            {formatMessage(labels.countdown, { seconds: secret.secondsLeft })}
          </span>
        </div>
      ) : null}
      {secret.message ? (
        <p className={styles.error} role="alert">
          {secret.message}
        </p>
      ) : null}
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
