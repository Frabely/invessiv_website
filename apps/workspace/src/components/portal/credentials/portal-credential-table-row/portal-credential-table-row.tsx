"use client";

import type { Ref } from "react";
import {
  faCheck,
  faCopy,
  faEye,
  faEyeSlash,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  DataTableCell,
  DataTableHeaderCell,
  DataTableRow,
} from "@invessiv/ui";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import { toCredentialLink } from "@/common/patterns/credentials/credential-link";
import { CredentialSecretValue } from "@/components/shared/credentials/credential-secret-value/credential-secret-value";
import { PortalOriginBadge } from "@/components/portal/shared/portal-origin-badge/portal-origin-badge";
import { CredentialTypeIcon } from "@/components/shared/credentials/credential-type-icon/credential-type-icon";
import { CredentialUsernameCopy } from "@/components/shared/credentials/credential-username-copy/credential-username-copy";
import type { Locale } from "@/config/i18n";
import { useCredentialSecret } from "@/hooks/shared/use-credential-secret";
import type { PortalCredentialsDictionary } from "@/i18n/dictionaries/portal";
import { formatTimestampDay } from "@/lib/i18n/format-timestamp-day";
import styles from "./portal-credential-table-row.module.css";

export type PortalCredentialTableRowProps = {
  /** Without it password and note stay masks without any action. */
  canReveal: boolean;
  /** Without it there is no "change" action at all. */
  canWrite: boolean;
  /** False while the server cannot encrypt: actions stay visible but inert. */
  configured: boolean;
  content: PortalCredentialsDictionary;
  credential: PortalCredentialDto;
  editButtonRef?: Ref<HTMLButtonElement>;
  locale: Locale;
  /** The project column's text; null when the table shows no project column. */
  projectLabel: string | null;
  onEditAction: (credential: PortalCredentialDto) => void;
  onRevealAction: (
    credential: PortalCredentialDto,
    field: CredentialSecretField,
    intent: CredentialRevealIntent,
  ) => Promise<CredentialRevealOutcome>;
};

/**
 * One released credential as a table row. Show and copy sit next to the password they act on:
 * "show" uncovers the password and, when there is one, the note in the same cell; "copy" takes
 * only the password. Changing the entry is the row action. On a phone the row is a card whose
 * fields carry their own inline labels. The portal changes an entry but never deletes or moves it.
 */
export function PortalCredentialTableRow({
  canReveal,
  canWrite,
  configured,
  content,
  credential,
  editButtonRef,
  locale,
  projectLabel,
  onEditAction,
  onRevealAction,
}: PortalCredentialTableRowProps) {
  const { row, secretField: labels, table } = content;
  const named = { name: credential.title };
  const autoHideSeconds = CREDENTIAL_LIMITS.autoHideSeconds;
  const secret = useCredentialSecret({
    autoHideSeconds,
    labels,
    name: formatMessage(row.secretNamed, named),
    reveal: (intent) =>
      onRevealAction(credential, CredentialSecretField.Secret, intent),
  });
  const note = useCredentialSecret({
    autoHideSeconds,
    labels,
    name: formatMessage(row.noteNamed, named),
    reveal: (intent) =>
      onRevealAction(credential, CredentialSecretField.Note, intent),
  });
  const link = toCredentialLink(credential.url);
  const shown = secret.isVisible || note.isVisible;
  const revealName = formatMessage(
    credential.hasNote ? row.secretAndNoteNamed : row.secretNamed,
    named,
  );

  function toggleShown() {
    if (shown) {
      secret.hide();
      note.hide();
      return;
    }
    secret.show();
    if (credential.hasNote) note.show();
  }

  return (
    <DataTableRow className={styles.row} mobileCard>
      <DataTableHeaderCell
        className={styles.accessCell}
        mobileCardSlot="primary"
        scope="row"
      >
        <span className={styles.identity}>
          <CredentialTypeIcon framed type={credential.credentialType} />
          <span className={styles.text}>
            <span className={styles.titleLine}>
              <span className={styles.title}>{credential.title}</span>
            </span>
            {link ? (
              <a
                className={styles.link}
                href={link}
                rel="noopener noreferrer"
                target="_blank"
              >
                {credential.url}
                <span className="sr-only">{` (${row.opensInNewTab})`}</span>
              </a>
            ) : (
              <span className={styles.sub}>
                {credential.url ?? content.types[credential.credentialType]}
              </span>
            )}
          </span>
        </span>
      </DataTableHeaderCell>
      <DataTableCell className={styles.originCell}>
        <PortalOriginBadge
          fromCustomer={credential.createdByCustomer}
          label={credential.createdByCustomer ? row.fromYou : row.fromUs}
        />
      </DataTableCell>
      <DataTableCell className={styles.fieldCell} mobileCardSlot="detail">
        {credential.username ? (
          <span className={styles.field}>
            <span className={styles.fieldLabel}>{table.columns.username}</span>
            <span className={styles.username}>
              <span className={styles.usernameText} title={credential.username}>
                {credential.username}
              </span>
              <CredentialUsernameCopy
                compact
                labels={content}
                title={credential.title}
                username={credential.username}
              />
            </span>
          </span>
        ) : null}
      </DataTableCell>
      <DataTableCell className={styles.fieldCell} mobileCardSlot="detail">
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{table.columns.secret}</span>
          <div className={styles.secrets}>
            <div className={styles.secretRow}>
              <CredentialSecretValue
                announcement={secret.announcement}
                autoHideSeconds={autoHideSeconds}
                compact
                labels={labels}
                message={secret.message}
                secondsLeft={secret.secondsLeft}
                value={secret.value}
                visible={secret.isVisible}
              />
              {canReveal ? (
                <span className={styles.secretActions}>
                  <ButtonControl
                    aria-label={formatMessage(
                      shown ? labels.hideNamed : labels.showNamed,
                      { name: revealName },
                    )}
                    disabled={
                      !shown &&
                      (!configured || secret.isLoading || note.isLoading)
                    }
                    onClick={toggleShown}
                    size={ButtonSize.Icon}
                    title={shown ? labels.hide : labels.show}
                    type="button"
                    variant={ButtonVariant.Quiet}
                  >
                    <FontAwesomeIcon
                      aria-hidden="true"
                      icon={shown ? faEyeSlash : faEye}
                    />
                  </ButtonControl>
                  <ButtonControl
                    aria-label={formatMessage(labels.copyNamed, {
                      name: formatMessage(row.secretNamed, named),
                    })}
                    disabled={!configured}
                    onClick={secret.copy}
                    size={ButtonSize.Icon}
                    title={secret.copied ? labels.copied : labels.copy}
                    type="button"
                    variant={ButtonVariant.Quiet}
                  >
                    <FontAwesomeIcon
                      aria-hidden="true"
                      icon={secret.copied ? faCheck : faCopy}
                    />
                  </ButtonControl>
                </span>
              ) : null}
            </div>
            {credential.hasNote ? (
              <div className={styles.secretLine}>
                <span className={styles.noteLabel}>{row.note}</span>
                <CredentialSecretValue
                  announcement={note.announcement}
                  autoHideSeconds={autoHideSeconds}
                  compact
                  labels={labels}
                  message={note.message}
                  multiline
                  secondsLeft={note.secondsLeft}
                  showTimer={!secret.isVisible}
                  value={note.value}
                  visible={note.isVisible}
                />
              </div>
            ) : null}
          </div>
        </div>
      </DataTableCell>
      {projectLabel === null ? null : (
        <DataTableCell className={styles.projectCell} mobileCardSlot="detail">
          <span className={styles.field}>
            <span className={styles.fieldLabel}>{table.columns.project}</span>
            <span>{projectLabel}</span>
          </span>
        </DataTableCell>
      )}
      <DataTableCell className={styles.changedCell} mobileCardSlot="detail">
        <span className={styles.field}>
          <span className={styles.fieldLabel}>{table.columns.changed}</span>
          <span className={styles.changed}>
            {formatTimestampDay(credential.secretChangedAt, locale)}
            {/* The card has no origin column, so the badge joins the date. */}
            <span className={styles.changedOrigin}>
              <PortalOriginBadge
                fromCustomer={credential.createdByCustomer}
                label={credential.createdByCustomer ? row.fromYou : row.fromUs}
              />
            </span>
          </span>
        </span>
      </DataTableCell>
      {canWrite ? (
        <DataTableCell className={styles.actionCell} mobileCardSlot="actions">
          <ButtonControl
            ref={editButtonRef}
            aria-label={formatMessage(row.editNamed, named)}
            disabled={!configured}
            onClick={() => onEditAction(credential)}
            size={ButtonSize.Icon}
            title={row.edit}
            type="button"
            variant={ButtonVariant.Quiet}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPen} />
          </ButtonControl>
        </DataTableCell>
      ) : (
        <DataTableCell mobileCardSlot="actions" />
      )}
    </DataTableRow>
  );
}
