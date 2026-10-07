"use client";

import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ConfirmDialog } from "@invessiv/ui";
import { credentialsApiService } from "@/client/crm/credentials-api-service";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./credential-delete-dialog.module.css";

type CredentialDeleteDialogProps = {
  content: CrmCredentialsDictionary;
  credential: CredentialDto;
  onCloseAction: () => void;
  onDeletedAction: (credential: CredentialDto) => void;
  /** A conflict hands over the fresh entry, so the list shows what changed. */
  onChangedAction: (credential: CredentialDto) => void;
};

/** Names the entry and says that deleting is final; there is no trash for credentials. */
export function CredentialDeleteDialog({
  content,
  credential,
  onCloseAction,
  onDeletedAction,
  onChangedAction,
}: CredentialDeleteDialogProps) {
  const mutation = useVersionedMutation<CredentialDto, CredentialApiErrorCode>(
    credential,
    onCloseAction,
    { onConflictAction: onChangedAction },
  );
  const current = mutation.current;
  const message = mutation.hasConflict
    ? content.delete.conflict
    : mutation.errorCode
      ? content.errors[mutation.errorCode]
      : null;

  async function confirm() {
    if (mutation.isSubmitting) return;
    await mutation.submit(async (entry) => {
      const result = await credentialsApiService.remove(
        entry.id,
        entry.version,
      );
      if (result.ok) onDeletedAction(entry);
      return result;
    });
  }

  return (
    <ConfirmDialog
      busy={mutation.isSubmitting}
      cancelLabel={content.delete.cancel}
      closeLabel={content.delete.close}
      confirmLabel={content.delete.confirm}
      description={formatMessage(content.delete.description, {
        name: current.title,
      })}
      onCancelAction={mutation.close}
      onConfirmAction={confirm}
      title={content.delete.title}
      tone="danger"
    >
      {message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
