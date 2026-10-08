"use client";

import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ConfirmDialog } from "@invessiv/ui";
import { credentialsApiService } from "@/client/crm/credentials-api-service";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./credential-portal-visibility-dialog.module.css";

type CredentialPortalVisibilityDialogProps = {
  content: CrmCredentialsDictionary;
  credential: CredentialDto;
  onCloseAction: () => void;
  onChangedAction: (credential: CredentialDto) => void;
  /** A conflict hands over the fresh entry, so the list shows what changed. */
  onConflictAction: (credential: CredentialDto) => void;
};

/**
 * Releasing says out loud what becomes readable: username, password and the note. The direction
 * is fixed when the dialog opens, so a conflict never flips what the button does.
 */
export function CredentialPortalVisibilityDialog({
  content,
  credential,
  onCloseAction,
  onChangedAction,
  onConflictAction,
}: CredentialPortalVisibilityDialogProps) {
  const release = !credential.visibleToCustomer;
  const mutation = useVersionedMutation<CredentialDto, CredentialApiErrorCode>(
    credential,
    onCloseAction,
    { onConflictAction },
  );
  const texts = release
    ? content.portalVisibility.release
    : content.portalVisibility.withdraw;
  const message = mutation.hasConflict
    ? content.portalVisibility.conflict
    : mutation.errorCode
      ? content.errors[mutation.errorCode]
      : null;

  async function confirm() {
    if (mutation.isSubmitting) return;
    await mutation.submit(async (entry) => {
      const result = await credentialsApiService.setPortalVisibility(entry.id, {
        version: entry.version,
        visibleToCustomer: release,
      });
      if (!result.ok) return result;
      onChangedAction(result.value);
      return { ok: true, current: result.value };
    });
  }

  return (
    <ConfirmDialog
      busy={mutation.isSubmitting}
      cancelLabel={content.portalVisibility.cancel}
      closeLabel={content.portalVisibility.close}
      confirmLabel={texts.confirm}
      description={formatMessage(texts.description, {
        name: mutation.current.title,
      })}
      onCancelAction={mutation.close}
      onConfirmAction={confirm}
      title={texts.title}
    >
      {texts.hint ? <p className={styles.hint}>{texts.hint}</p> : null}
      {message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
