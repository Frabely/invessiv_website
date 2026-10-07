"use client";

import { type Ref, useEffect, useRef, useState } from "react";
import {
  faCheck,
  faCopy,
  faPen,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField as SecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import { toCredentialLink } from "@/common/patterns/credentials/credential-link";
import { CredentialSecretField } from "@/components/shared/credentials/credential-secret-field/credential-secret-field";
import { CredentialTypeIcon } from "@/components/shared/credentials/credential-type-icon/credential-type-icon";
import type { Locale } from "@/config/i18n";
import type { CrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatTimestampDay } from "@/lib/i18n/format-timestamp-day";
import styles from "./credential-row.module.css";

type CredentialRowProps = {
  /** False without a keyring: reveal and edit stay visible but inert. */
  configured: boolean;
  content: CrmCredentialsDictionary;
  credential: CredentialDto;
  locale: Locale;
  editButtonRef?: Ref<HTMLButtonElement>;
  deleteButtonRef?: Ref<HTMLButtonElement>;
  onDeleteAction: (credential: CredentialDto) => void;
  onEditAction: (credential: CredentialDto) => void;
  onRevealAction: (
    credential: CredentialDto,
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
 * One credential as metadata. Password and note are masks until requested; which actions exist
 * follows from the entry's own capabilities, because bound roles differ per project.
 */
export function CredentialRow({
  configured,
  content,
  credential,
  locale,
  editButtonRef,
  deleteButtonRef,
  onDeleteAction,
  onEditAction,
  onRevealAction,
}: CredentialRowProps) {
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

  const { canReveal, canWrite } = credential.capabilities;
  const named = { name: credential.title };
  const link = toCredentialLink(credential.url);

  async function copyUsername() {
    if (!credential.username) return;
    try {
      await navigator.clipboard.writeText(credential.username);
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
      key={`${credential.id}:${credential.version}:${canReveal}:${configured}:${field}`}
      autoHideSeconds={CREDENTIAL_LIMITS.autoHideSeconds}
      canReveal={canReveal}
      disabled={!configured}
      labels={content.secretField}
      multiline={multiline}
      name={formatMessage(name, named)}
      onRevealAction={(intent) => onRevealAction(credential, field, intent)}
    />
  );

  return (
    <li className={styles.row}>
      <div className={styles.head}>
        <span className={styles.icon}>
          <CredentialTypeIcon type={credential.credentialType} />
        </span>
        <div className={styles.heading}>
          <p className={styles.title}>{credential.title}</p>
          <p className={styles.type}>
            {content.types[credential.credentialType]}
          </p>
        </div>
        {canWrite ? (
          <div
            aria-label={formatMessage(content.row.actionsLabel, named)}
            className={styles.rowActions}
            role="group"
          >
            <button
              ref={editButtonRef}
              aria-label={formatMessage(content.row.editNamed, named)}
              className={styles.iconButton}
              disabled={!configured}
              onClick={() => onEditAction(credential)}
              title={content.row.edit}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faPen} />
            </button>
            <button
              ref={deleteButtonRef}
              aria-label={formatMessage(content.row.deleteNamed, named)}
              className={styles.iconButton}
              data-tone="danger"
              onClick={() => onDeleteAction(credential)}
              title={content.row.delete}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faTrashCan} />
            </button>
          </div>
        ) : null}
      </div>
      <dl className={styles.facts}>
        {credential.url ? (
          <div className={styles.fact}>
            <dt>{content.row.url}</dt>
            <dd className={styles.text}>
              {link ? (
                <a
                  className={styles.link}
                  href={link}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {credential.url}
                  <span className="sr-only">
                    {` (${content.row.opensInNewTab})`}
                  </span>
                </a>
              ) : (
                credential.url
              )}
            </dd>
          </div>
        ) : null}
        {credential.username ? (
          <div className={styles.fact}>
            <dt>{content.row.username}</dt>
            <dd className={styles.username}>
              <span className={styles.text}>{credential.username}</span>
              <button
                aria-label={formatMessage(content.row.copyUsernameNamed, named)}
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
                    usernameCopy === UsernameCopyStatus.Copied
                      ? faCheck
                      : faCopy
                  }
                />
                <span>
                  {usernameCopy === UsernameCopyStatus.Copied
                    ? content.row.usernameCopied
                    : content.row.copyUsername}
                </span>
              </button>
              <span aria-live="polite" className="sr-only" role="status">
                {usernameCopy === UsernameCopyStatus.Copied
                  ? content.row.usernameCopiedAnnouncement
                  : ""}
              </span>
              {usernameCopy === UsernameCopyStatus.Failed ? (
                <span className={styles.copyError} role="alert">
                  {content.secretField.clipboardFailed}
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}
        <div className={styles.fact}>
          <dt>{content.row.secret}</dt>
          <dd>{secretField(SecretField.Secret, content.row.secretNamed)}</dd>
        </div>
        {credential.hasNote ? (
          <div className={styles.fact}>
            <dt>{content.row.note}</dt>
            <dd>
              {secretField(SecretField.Note, content.row.noteNamed, true)}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className={styles.meta}>
        <span>
          {formatMessage(content.row.secretChanged, {
            date: formatTimestampDay(credential.secretChangedAt, locale),
          })}
        </span>
        <span>
          {credential.lastRevealedAt
            ? formatMessage(content.row.lastRevealed, {
                date: formatTimestampDay(credential.lastRevealedAt, locale),
              })
            : content.row.neverRevealed}
        </span>
      </p>
    </li>
  );
}
