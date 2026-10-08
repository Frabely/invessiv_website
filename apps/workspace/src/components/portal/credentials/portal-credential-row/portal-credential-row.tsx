"use client";

import type { Ref } from "react";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import { CredentialFacts } from "@/components/shared/credentials/credential-facts/credential-facts";
import { CredentialTypeIcon } from "@/components/shared/credentials/credential-type-icon/credential-type-icon";
import type { Locale } from "@/config/i18n";
import type { PortalCredentialsDictionary } from "@/i18n/dictionaries/portal";
import { formatTimestampDay } from "@/lib/i18n/format-timestamp-day";
import styles from "./portal-credential-row.module.css";

export type PortalCredentialRowProps = {
  /** From the page's capabilities: without it password and note stay masks without any action. */
  canReveal: boolean;
  /** Without it there is no "change" action at all. */
  canWrite: boolean;
  /** False while the server cannot encrypt: actions stay visible but inert. */
  configured: boolean;
  content: PortalCredentialsDictionary;
  credential: PortalCredentialDto;
  editButtonRef?: Ref<HTMLButtonElement>;
  locale: Locale;
  onEditAction: (credential: PortalCredentialDto) => void;
  onRevealAction: (
    credential: PortalCredentialDto,
    field: CredentialSecretField,
    intent: CredentialRevealIntent,
  ) => Promise<CredentialRevealOutcome>;
};

/** One released credential as metadata. The portal changes an entry but never deletes or moves it. */
export function PortalCredentialRow({
  canReveal,
  canWrite,
  configured,
  content,
  credential,
  editButtonRef,
  locale,
  onEditAction,
  onRevealAction,
}: PortalCredentialRowProps) {
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
          <button
            ref={editButtonRef}
            aria-label={formatMessage(content.row.editNamed, {
              name: credential.title,
            })}
            className={styles.edit}
            disabled={!configured}
            onClick={() => onEditAction(credential)}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPen} />
            <span>{content.row.edit}</span>
          </button>
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
        {credential.createdByCustomer ? (
          <span>{content.row.fromYou}</span>
        ) : null}
      </p>
    </li>
  );
}
