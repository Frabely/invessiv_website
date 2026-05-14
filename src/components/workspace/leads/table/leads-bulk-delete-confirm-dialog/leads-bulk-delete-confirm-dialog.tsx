"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { HttpResponseCode } from "@/common/constants/http/http-response-codes";
import { LeadBulkAction } from "@/common/constants/leads/bulk/lead-bulk-actions";
import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";
import { ButtonControl } from "@/components/shared/button/button";
import { FormStatus } from "@/components/shared/form/form-status/form-status";
import { trapDialogFocus } from "@/components/workspace/leads/shared/dialog-focus-trap";
import type { LeadsBulkDictionary } from "@/i18n/dictionaries/workspace/leads";

import styles from "./leads-bulk-delete-confirm-dialog.module.css";

const BULK_API_ENDPOINT = "/api/workspace/leads/bulk";

const LEAD_LIST_MAX_VISIBLE = 10;

const DialogId = {
  Title: "leads-bulk-delete-confirm-title",
  Description: "leads-bulk-delete-confirm-description",
} as const;

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

function buildMoreSuffix(
  bulkContent: LeadsBulkDictionary,
  remaining: number,
): string {
  return bulkContent.deleteConfirm.leadListMoreSuffix.replace(
    "{count}",
    String(remaining),
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
      const response = await fetch(BULK_API_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: LeadBulkAction.Delete,
          ids: selectedLeads.map((lead) => lead.id),
        }),
      });
      if (response.status !== HttpResponseCode.Ok) {
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
  const visibleLeads = selectedLeads.slice(0, LEAD_LIST_MAX_VISIBLE);
  const remaining = selectedLeads.length - visibleLeads.length;
  const statusMessage = isPending
    ? bulkContent.deleteConfirm.status.deleting
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
            <p className={styles.kicker}>{bulkContent.deleteConfirm.kicker}</p>
            <h2 className={styles.title} id={DialogId.Title}>
              {bulkContent.deleteConfirm.title}
            </h2>
            <p className={styles.description} id={DialogId.Description}>
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

        <FormStatus className={styles.statusBanner} message={statusMessage} />
        {errorMessage ? (
          <p className={styles.errorBanner} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <ul className={styles.leadList}>
          {visibleLeads.map((lead) => (
            <li className={styles.leadItem} key={lead.id}>
              <strong>{lead.displayName}</strong>
            </li>
          ))}
          {remaining > 0 ? (
            <li className={styles.moreItem}>
              {buildMoreSuffix(bulkContent, remaining)}
            </li>
          ) : null}
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
