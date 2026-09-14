"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactLeadStatus as ContactLeadStatusValue } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadDeleteAction } from "@invessiv/common/constants/leads/delete/lead-delete-actions";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import { ButtonControl, ConfirmDialog, FormStatus } from "@invessiv/ui";
import { leadsService } from "../../form/lead-form-dialog/leads-service";
import type { LeadsDeleteDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./lead-delete-confirm-dialog.module.css";

type LeadDeleteConfirmDialogProps = {
  canArchive: boolean;
  content: LeadsDeleteDictionary;
  currentStatus: ContactLeadStatusValue;
  leadDisplayName: string;
  leadId: string;
  onCloseAction: () => void;
  onSuccessAction?: () => void;
};

type PendingAction = LeadDeleteAction | null;

function formatDescription(template: string, name: string): string {
  return template.replace("{name}", name);
}

function getErrorMessage(
  code: string | undefined,
  content: LeadsDeleteDictionary,
): string {
  if (code === LeadErrorCode.NotFound) {
    return content.errors.notFound;
  }
  return content.errors.internal;
}

export function LeadDeleteConfirmDialog({
  canArchive,
  content,
  currentStatus,
  leadDisplayName,
  leadId,
  onCloseAction,
  onSuccessAction,
}: LeadDeleteConfirmDialogProps) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isArchived = currentStatus === ContactLeadStatus.Archived;

  async function handleArchive() {
    setPending(LeadDeleteAction.Archive);
    setErrorMessage(null);
    const result = await leadsService.updateLead(leadId, {
      lead_status: ContactLeadStatus.Archived,
    });
    if (!result.ok) {
      setPending(null);
      setErrorMessage(getErrorMessage(result.code, content));
      return;
    }
    router.refresh();
    onSuccessAction?.();
    onCloseAction();
  }

  async function handleDelete() {
    setPending(LeadDeleteAction.Delete);
    setErrorMessage(null);
    const result = await leadsService.deleteLead(leadId);
    if (!result.ok) {
      setPending(null);
      setErrorMessage(getErrorMessage(result.code, content));
      return;
    }
    router.refresh();
    onSuccessAction?.();
    onCloseAction();
  }

  const isBusy = pending !== null;
  const description = formatDescription(
    content.dialog.description,
    leadDisplayName,
  );
  const statusMessage =
    pending === LeadDeleteAction.Archive
      ? content.status.archiving
      : pending === LeadDeleteAction.Delete
        ? content.status.deleting
        : null;

  return (
    <ConfirmDialog
      busy={isBusy}
      cancelLabel={content.buttons.cancel}
      closeLabel={content.dialog.closeAriaLabel}
      confirmLabel={content.buttons.confirmDelete}
      description={description}
      onCancelAction={onCloseAction}
      onConfirmAction={handleDelete}
      secondaryAction={
        canArchive && !isArchived ? (
          <ButtonControl
            disabled={isBusy}
            onClick={handleArchive}
            type="button"
            variant="ghost"
          >
            {content.buttons.archive}
          </ButtonControl>
        ) : undefined
      }
      title={content.dialog.title}
      tone="danger"
    >
      <p className={styles.kicker}>{content.dialog.kicker}</p>
      <FormStatus className={styles.statusBanner} message={statusMessage} />
      {errorMessage ? (
        <p className={styles.errorBanner} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
