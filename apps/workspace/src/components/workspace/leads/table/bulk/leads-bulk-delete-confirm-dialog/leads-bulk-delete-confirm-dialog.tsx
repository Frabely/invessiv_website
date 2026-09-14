"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";

import type { LeadSummaryDto } from "@invessiv/common/contracts/leads/lead-summary.dto";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import { ButtonControl, Dialog, FormStatus } from "@invessiv/ui";
import type { LeadsBulkDictionary } from "@/i18n/dictionaries/workspace/leads";

import { leadsBulkEditService } from "../../services/leads-bulk-edit-service";

import styles from "./leads-bulk-delete-confirm-dialog.module.css";

type LeadsBulkDeleteConfirmDialogProps = {
  bulkContent: LeadsBulkDictionary;
  onCloseAction: () => void;
  onSuccessAction: () => void;
  selectedLeads: LeadSummaryDto[];
};

function buildMessage(bulkContent: LeadsBulkDictionary, count: number): string {
  if (count === 1) {
    return bulkContent.deleteConfirm.messageOne;
  }
  return bulkContent.deleteConfirm.messageMany.replace(
    "{count}",
    String(count),
  );
}

export function LeadsBulkDeleteConfirmDialog({
  bulkContent,
  onCloseAction,
  onSuccessAction,
  selectedLeads,
}: LeadsBulkDeleteConfirmDialogProps) {
  const router = useRouter();
  const statusId = useId();
  const errorId = useId();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirm() {
    setErrorMessage(null);
    setIsPending(true);
    try {
      const result = await leadsBulkEditService.delete({
        ids: selectedLeads.map((lead) => lead.id),
      });
      if (!result.ok) {
        setIsPending(false);
        setErrorMessage(bulkContent.errors.generic);
        return;
      }
      router.refresh();
      onSuccessAction();
    } catch {
      setIsPending(false);
      setErrorMessage(bulkContent.errors.network);
    }
  }

  const message = buildMessage(bulkContent, selectedLeads.length);
  const statusMessage = isPending
    ? bulkContent.deleteConfirm.status.deleting
    : null;
  return (
    <Dialog
      aria-busy={isPending}
      busy={isPending}
      closeLabel={bulkContent.deleteConfirm.closeAriaLabel}
      description={message}
      footer={null}
      onCloseAction={onCloseAction}
      size={DialogSize.Narrow}
      title={bulkContent.deleteConfirm.title}
    >
      <p className={styles.warning} role="note">
        {bulkContent.deleteConfirm.warning}
      </p>

      {statusMessage ? (
        <div id={statusId}>
          <FormStatus className={styles.statusBanner} message={statusMessage} />
        </div>
      ) : null}
      {errorMessage ? (
        <p className={styles.errorBanner} id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <ul className={styles.leadList}>
        {selectedLeads.map((lead) => (
          <li className={styles.leadItem} key={lead.id}>
            <strong>{lead.displayName}</strong>
          </li>
        ))}
      </ul>

      <footer className={styles.footer}>
        <ButtonControl
          disabled={isPending}
          onClick={onCloseAction}
          type="button"
          variant="ghost"
        >
          {bulkContent.deleteConfirm.cancel}
        </ButtonControl>
        <button
          className={styles.confirmButton}
          disabled={isPending}
          onClick={handleConfirm}
          type="button"
        >
          {bulkContent.deleteConfirm.confirm}
        </button>
      </footer>
    </Dialog>
  );
}
