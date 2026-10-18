"use client";

import {
  faCheck,
  faCopy,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import type { CredentialSecretFieldLabels } from "@/common/contracts/credentials/credential-secret-field-labels";
import { CredentialSecretValue } from "@/components/shared/credentials/credential-secret-value/credential-secret-value";
import { useCredentialSecret } from "@/hooks/shared/use-credential-secret";
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
  const secret = useCredentialSecret({
    autoHideSeconds,
    labels,
    name,
    reveal: onRevealAction,
  });
  const named = { name };
  const toggleLabel = secret.isVisible ? labels.hide : labels.show;

  return (
    <div className={styles.field}>
      <CredentialSecretValue
        announcement={secret.announcement}
        autoHideSeconds={autoHideSeconds}
        labels={labels}
        message={secret.message}
        multiline={multiline}
        secondsLeft={secret.secondsLeft}
        value={secret.value}
        visible={secret.isVisible}
      />
      {canReveal ? (
        <div className={styles.actions}>
          <button
            aria-label={formatMessage(
              secret.isVisible ? labels.hideNamed : labels.showNamed,
              named,
            )}
            className={styles.action}
            disabled={disabled || secret.isLoading}
            onClick={secret.toggle}
            type="button"
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={secret.isVisible ? faEyeSlash : faEye}
            />
            <span>{secret.isLoading ? labels.loading : toggleLabel}</span>
          </button>
          <button
            aria-label={formatMessage(labels.copyNamed, named)}
            className={styles.action}
            data-copied={secret.copied ? "true" : "false"}
            disabled={disabled}
            onClick={secret.copy}
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
    </div>
  );
}
