"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ContactLeadStatus as ContactLeadStatusValue } from "@/common/constants/contact/contact-lead-statuses";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadDeleteAction } from "@/common/constants/leads/delete/lead-delete-actions";
import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";
import { ButtonControl } from "@/components/shared/button/button";
import { FormStatus } from "@/components/shared/form/form-status/form-status";
import { trapDialogFocus } from "../../shared/dialog-focus-trap";
import { leadsService } from "../../form/lead-form-dialog/leads-service";
import type { LeadsDeleteDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./lead-delete-confirm-dialog.module.css";

type LeadDeleteConfirmDialogProps = {
  content: LeadsDeleteDictionary;
  currentStatus: ContactLeadStatusValue;
  leadDisplayName: string;
  leadId: string;
  onCloseAction: () => void;
  onSuccessAction?: () => void;
};

const DialogId = {
  Description: "lead-delete-dialog-description",
  Title: "lead-delete-dialog-title",
} as const;

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
  content,
  currentStatus,
  leadDisplayName,
  leadId,
  onCloseAction,
  onSuccessAction,
}: LeadDeleteConfirmDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isArchived = currentStatus === ContactLeadStatus.Archived;

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const container = dialogRef.current;
      if (!container) {
        return;
      }
      const firstButton = container.querySelector<HTMLButtonElement>(
        "button[type='button']",
      );
      firstButton?.focus();
    });
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    trapDialogFocus(event, event.currentTarget, onCloseAction);
  }

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

  return createPortal(
    <div className={styles.overlay} role="presentation">
      <div
        aria-describedby={DialogId.Description}
        aria-labelledby={DialogId.Title}
        aria-modal="true"
        className={styles.dialog}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <p className={styles.kicker}>{content.dialog.kicker}</p>
            <h2 className={styles.title} id={DialogId.Title}>
              {content.dialog.title}
            </h2>
            <p className={styles.description} id={DialogId.Description}>
              {description}
            </p>
          </div>

          <ButtonControl
            aria-label={content.dialog.closeAriaLabel}
            className={styles.closeButton}
            disabled={isBusy}
            onClick={onCloseAction}
            title={content.dialog.closeAriaLabel}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </ButtonControl>
        </header>

        <FormStatus className={styles.statusBanner} message={statusMessage} />
        {errorMessage ? (
          <p className={styles.errorBanner} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <footer className={styles.footer}>
          <ButtonControl
            disabled={isBusy}
            onClick={onCloseAction}
            type="button"
            variant="ghost"
          >
            {content.buttons.cancel}
          </ButtonControl>
          {!isArchived ? (
            <ButtonControl
              disabled={isBusy}
              onClick={handleArchive}
              type="button"
              variant="ghost"
            >
              {content.buttons.archive}
            </ButtonControl>
          ) : null}
          <button
            className={styles.confirmDeleteButton}
            disabled={isBusy}
            onClick={handleDelete}
            type="button"
          >
            {content.buttons.confirmDelete}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
