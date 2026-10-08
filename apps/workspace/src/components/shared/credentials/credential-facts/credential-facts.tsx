"use client";

import { useEffect, useRef, useState } from "react";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField as SecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { CredentialFactsLabels } from "@/common/contracts/credentials/credential-facts-labels";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import type { CredentialFormSource } from "@/common/contracts/crm/credentials/credential-form-source";
import { toCredentialLink } from "@/common/patterns/credentials/credential-link";
import { CredentialSecretField } from "@/components/shared/credentials/credential-secret-field/credential-secret-field";
import styles from "./credential-facts.module.css";

export type CredentialFactsProps = {
  /** Without it password and note stay masks without any action. */
  canReveal: boolean;
  /** False without a keyring: the reveal actions stay visible but inert. */
  configured: boolean;
  entry: CredentialFormSource;
  labels: CredentialFactsLabels;
  onRevealAction: (
    field: SecretField,
    intent: CredentialRevealIntent,
  ) => Promise<CredentialRevealOutcome>;
};

const COPIED_FEEDBACK_MS = 2000;
const UsernameCopyStatus = {
  Idle: "idle",
  Copied: "copied",
  Failed: "failed",
} as const;
type UsernameCopyStatus =
  (typeof UsernameCopyStatus)[keyof typeof UsernameCopyStatus];

/**
 * Address, login name, password and note of one credential, shared by the CRM and the portal. The
 * login name is plaintext and always copyable; password and note are masks until requested. The
 * surrounding list provides the `credentials-list` container the layout responds to.
 */
export function CredentialFacts({
  canReveal,
  configured,
  entry,
  labels,
  onRevealAction,
}: CredentialFactsProps) {
  const [usernameCopy, setUsernameCopy] = useState<UsernameCopyStatus>(
    UsernameCopyStatus.Idle,
  );
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const { row } = labels;
  const named = { name: entry.title };
  const link = toCredentialLink(entry.url);

  async function copyUsername() {
    if (!entry.username) return;
    try {
      await navigator.clipboard.writeText(entry.username);
      setUsernameCopy(UsernameCopyStatus.Copied);
    } catch {
      setUsernameCopy(UsernameCopyStatus.Failed);
    }
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(
      () => setUsernameCopy(UsernameCopyStatus.Idle),
      COPIED_FEEDBACK_MS,
    );
  }

  const secretField = (field: SecretField, name: string, multiline = false) => (
    <CredentialSecretField
      key={`${entry.id}:${entry.version}:${canReveal}:${configured}:${field}`}
      autoHideSeconds={CREDENTIAL_LIMITS.autoHideSeconds}
      canReveal={canReveal}
      disabled={!configured}
      labels={labels.secretField}
      multiline={multiline}
      name={formatMessage(name, named)}
      onRevealAction={(intent) => onRevealAction(field, intent)}
    />
  );

  return (
    <dl className={styles.facts}>
      {entry.url ? (
        <div className={styles.fact}>
          <dt>{row.url}</dt>
          <dd className={styles.text}>
            {link ? (
              <a
                className={styles.link}
                href={link}
                rel="noopener noreferrer"
                target="_blank"
              >
                {entry.url}
                <span className="sr-only">{` (${row.opensInNewTab})`}</span>
              </a>
            ) : (
              entry.url
            )}
          </dd>
        </div>
      ) : null}
      {entry.username ? (
        <div className={styles.fact}>
          <dt>{row.username}</dt>
          <dd className={styles.username}>
            <span className={styles.text}>{entry.username}</span>
            <button
              aria-label={formatMessage(row.copyUsernameNamed, named)}
              className={styles.copyButton}
              data-copied={
                usernameCopy === UsernameCopyStatus.Copied ? "true" : "false"
              }
              onClick={copyUsername}
              type="button"
            >
              <FontAwesomeIcon
                aria-hidden="true"
                icon={
                  usernameCopy === UsernameCopyStatus.Copied ? faCheck : faCopy
                }
              />
              <span>
                {usernameCopy === UsernameCopyStatus.Copied
                  ? row.usernameCopied
                  : row.copyUsername}
              </span>
            </button>
            <span aria-live="polite" className="sr-only" role="status">
              {usernameCopy === UsernameCopyStatus.Copied
                ? row.usernameCopiedAnnouncement
                : ""}
            </span>
            {usernameCopy === UsernameCopyStatus.Failed ? (
              <span className={styles.copyError} role="alert">
                {labels.secretField.clipboardFailed}
              </span>
            ) : null}
          </dd>
        </div>
      ) : null}
      <div className={styles.fact}>
        <dt>{row.secret}</dt>
        <dd>{secretField(SecretField.Secret, row.secretNamed)}</dd>
      </div>
      {entry.hasNote ? (
        <div className={styles.fact}>
          <dt>{row.note}</dt>
          <dd>{secretField(SecretField.Note, row.noteNamed, true)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
