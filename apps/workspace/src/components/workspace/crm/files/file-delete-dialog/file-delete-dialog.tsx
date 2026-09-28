"use client";

import { useState } from "react";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ConfirmDialog } from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./file-delete-dialog.module.css";

type FileDeleteDialogProps = {
  content: CrmFilesDictionary;
  file: FileDto;
  onCloseAction: () => void;
  onDeletedAction: (file: FileDto) => void;
  /** A conflict hands over the fresh entry, so the list shows what changed. */
  onChangedAction: (file: FileDto) => void;
};

/** Names the entry and warns when the customer currently sees it; deleting is final. */
export function FileDeleteDialog({
  content,
  file,
  onCloseAction,
  onDeletedAction,
  onChangedAction,
}: FileDeleteDialogProps) {
  const [current, setCurrent] = useState(file);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const result = await filesApiService.deleteFile(
      current.id,
      current.version,
    );
    setBusy(false);
    if (result.ok) {
      onDeletedAction(current);
      onCloseAction();
      return;
    }
    if ("current" in result) {
      setCurrent(result.current);
      onChangedAction(result.current);
      setMessage(content.delete.conflict);
      return;
    }
    setMessage(content.errors[result.code]);
  }

  return (
    <ConfirmDialog
      busy={busy}
      cancelLabel={content.delete.cancel}
      closeLabel={content.upload.close}
      confirmLabel={content.delete.confirm}
      description={formatMessage(content.delete.description, {
        name: current.displayName,
      })}
      onCancelAction={onCloseAction}
      onConfirmAction={confirm}
      title={
        current.source === FileSource.Link
          ? content.delete.titleLink
          : content.delete.titleFile
      }
      tone="danger"
    >
      {current.visibleToCustomer ? (
        <p className={styles.warning}>{content.delete.visibleWarning}</p>
      ) : null}
      {message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
