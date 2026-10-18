"use client";

import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import { CopyFeedbackStatus } from "@/common/constants/credentials/copy-feedback-status";
import type { CredentialFactsLabels } from "@/common/contracts/credentials/credential-facts-labels";
import { useCopyFeedback } from "@/hooks/shared/use-copy-feedback";
import styles from "./credential-username-copy.module.css";

export type CredentialUsernameCopyProps = {
  /** Icon only, for a table cell; otherwise the button names its action in text. */
  compact?: boolean;
  labels: CredentialFactsLabels;
  /** The credential's title, so the button says whose login name it copies. */
  title: string;
  username: string;
};

/**
 * Copies a plaintext login name, shared by the CRM cockpit and the portal. Brings its own
 * announcement and the clipboard error; the caller places it next to the name.
 */
export function CredentialUsernameCopy({
  compact = false,
  labels,
  title,
  username,
}: CredentialUsernameCopyProps) {
  const { row } = labels;
  const feedback = useCopyFeedback();
  const copied = feedback.status === CopyFeedbackStatus.Copied;
  const ariaLabel = formatMessage(row.copyUsernameNamed, { name: title });
  const text = copied ? row.usernameCopied : row.copyUsername;
  const icon = (
    <FontAwesomeIcon aria-hidden="true" icon={copied ? faCheck : faCopy} />
  );

  return (
    <>
      {compact ? (
        <ButtonControl
          aria-label={ariaLabel}
          onClick={() => void feedback.copy(username)}
          size={ButtonSize.Icon}
          title={text}
          type="button"
          variant={ButtonVariant.Quiet}
        >
          {icon}
        </ButtonControl>
      ) : (
        <button
          aria-label={ariaLabel}
          className={styles.button}
          data-copied={copied ? "true" : "false"}
          onClick={() => void feedback.copy(username)}
          type="button"
        >
          {icon}
          <span>{text}</span>
        </button>
      )}
      <span aria-live="polite" className="sr-only" role="status">
        {copied ? row.usernameCopiedAnnouncement : ""}
      </span>
      {feedback.status === CopyFeedbackStatus.Failed ? (
        <span className={styles.error} role="alert">
          {labels.secretField.clipboardFailed}
        </span>
      ) : null}
    </>
  );
}
