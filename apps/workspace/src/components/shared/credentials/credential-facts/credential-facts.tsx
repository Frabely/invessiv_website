"use client";

import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField as SecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { CredentialFactsLabels } from "@/common/contracts/credentials/credential-facts-labels";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import type { CredentialFormSource } from "@/common/contracts/crm/credentials/credential-form-source";
import { toCredentialLink } from "@/common/patterns/credentials/credential-link";
import { CredentialSecretField } from "@/components/shared/credentials/credential-secret-field/credential-secret-field";
import { CredentialUsernameCopy } from "@/components/shared/credentials/credential-username-copy/credential-username-copy";
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
  const { row } = labels;
  const named = { name: entry.title };
  const link = toCredentialLink(entry.url);

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
            <CredentialUsernameCopy
              labels={labels}
              title={entry.title}
              username={entry.username}
            />
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
