"use client";

import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";
import { ButtonControl } from "@/components/shared/button/button";
import { FormStatus } from "@/components/shared/form/form-status/form-status";
import { trapDialogFocus } from "@/components/workspace/leads/shared/dialog-focus-trap";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const errorId = useId();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const container = dialogRef.current;
      container
        ?.querySelector<HTMLButtonElement>("button[type='button']")
        ?.focus();
    });
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isPending) {
      if (event.key === "Escape") event.preventDefault();
      return;
    }
    trapDialogFocus(event, event.currentTarget, onCloseAction);
  }

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
  const describedBy = [
    descriptionId,
    statusMessage ? statusId : null,
    errorMessage ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return createPortal(
    <div className={styles.overlay} role="presentation">
      <div
        aria-busy={isPending}
        aria-describedby={describedBy || undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <p className={styles.kicker}>{bulkContent.deleteConfirm.kicker}</p>
            <h2 className={styles.title} id={titleId}>
              {bulkContent.deleteConfirm.title}
            </h2>
            <p className={styles.description} id={descriptionId}>
              {message}
            </p>
          </div>
          <ButtonControl
            aria-label={bulkContent.deleteConfirm.closeAriaLabel}
            className={styles.closeButton}
            disabled={isPending}
            onClick={onCloseAction}
            title={bulkContent.deleteConfirm.closeAriaLabel}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </ButtonControl>
        </header>

        <p className={styles.warning} role="note">
          {bulkContent.deleteConfirm.warning}
        </p>

        {statusMessage ? (
          <div id={statusId}>
            <FormStatus
              className={styles.statusBanner}
              message={statusMessage}
            />
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
      </div>
    </div>,
    document.body,
  );
}
