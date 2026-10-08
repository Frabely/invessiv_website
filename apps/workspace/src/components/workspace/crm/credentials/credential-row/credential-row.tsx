"use client";

import type { Ref } from "react";
import {
  faEye,
  faEyeSlash,
  faPen,
  faTrashCan,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { Badge } from "@invessiv/ui";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialSecretField as SecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import { CredentialFacts } from "@/components/shared/credentials/credential-facts/credential-facts";
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
  portalVisibilityButtonRef?: Ref<HTMLButtonElement>;
  onDeleteAction: (credential: CredentialDto) => void;
  onPortalVisibilityAction: (credential: CredentialDto) => void;
  onEditAction: (credential: CredentialDto) => void;
  onRevealAction: (
    credential: CredentialDto,
    field: SecretField,
    intent: CredentialRevealIntent,
  ) => Promise<CredentialRevealOutcome>;
};

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
  portalVisibilityButtonRef,
  onDeleteAction,
  onEditAction,
  onPortalVisibilityAction,
  onRevealAction,
}: CredentialRowProps) {
  const { canReveal, canWrite } = credential.capabilities;
  const named = { name: credential.title };
  const createdByCustomer =
    credential.createdBySide === CredentialSide.Customer;
  const releaseLabel = credential.visibleToCustomer
    ? content.row.withdraw
    : content.row.release;

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
          {credential.visibleToCustomer || createdByCustomer ? (
            <p className={styles.badges}>
              {createdByCustomer ? (
                <Badge
                  icon={faUser}
                  kind="origin"
                  label={content.row.badgeCustomer}
                  tone={BadgeTone.Info}
                />
              ) : null}
              {credential.visibleToCustomer ? (
                <Badge
                  icon={faEye}
                  kind="visibility"
                  label={content.row.badgePortal}
                  tone={BadgeTone.Warning}
                />
              ) : null}
            </p>
          ) : null}
        </div>
        {canWrite ? (
          <div
            aria-label={formatMessage(content.row.actionsLabel, named)}
            className={styles.rowActions}
            role="group"
          >
            {createdByCustomer ? null : (
              <button
                ref={portalVisibilityButtonRef}
                aria-label={formatMessage(
                  credential.visibleToCustomer
                    ? content.row.withdrawNamed
                    : content.row.releaseNamed,
                  named,
                )}
                className={styles.iconButton}
                onClick={() => onPortalVisibilityAction(credential)}
                title={releaseLabel}
                type="button"
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  icon={credential.visibleToCustomer ? faEyeSlash : faEye}
                />
              </button>
            )}
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
      <CredentialFacts
        canReveal={canReveal}
        configured={configured}
        entry={credential}
        labels={content}
        onRevealAction={(field, intent) =>
          onRevealAction(credential, field, intent)
        }
      />
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
