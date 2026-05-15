"use client";

import { useState } from "react";

import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";
import { ButtonControl } from "@/components/shared/button/button";
import { useLeadsTableSelection } from "@/components/workspace/leads/table/leads-table-selection-provider/leads-table-selection-context";
import { BulkDialogKind } from "@/common/constants/leads/bulk/bulk-dialog-kinds";
import type {
  LeadsBulkDictionary,
  LeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";

import { LeadsBulkArchiveConfirmDialog } from "../leads-bulk-archive-confirm-dialog/leads-bulk-archive-confirm-dialog";
import { LeadsBulkDeleteConfirmDialog } from "../leads-bulk-delete-confirm-dialog/leads-bulk-delete-confirm-dialog";
import { LeadsBulkEditDialog } from "../leads-bulk-edit-dialog/leads-bulk-edit-dialog";

import styles from "./leads-bulk-action-bar.module.css";

type LeadsBulkActionBarProps = {
  bulkContent: LeadsBulkDictionary;
  categories: LeadCategoryOption[];
  rows: LeadSummaryDto[];
  sharedContent: LeadsSharedDictionary;
};

function formatSelectedSummary(
  bulkContent: LeadsBulkDictionary,
  count: number,
): string {
  if (count === 1) {
    return bulkContent.summary.selectedOne;
  }
  return bulkContent.summary.selectedMany.replace("{count}", String(count));
}

export function LeadsBulkActionBar({
  bulkContent,
  categories,
  rows,
  sharedContent,
}: LeadsBulkActionBarProps) {
  const selection = useLeadsTableSelection();
  const [openDialog, setOpenDialog] = useState<BulkDialogKind | null>(null);

  if (selection.selectedCount === 0) {
    return null;
  }

  const selectedLeads = rows.filter((row) =>
    selection.selectedIds.includes(row.id),
  );

  if (selectedLeads.length === 0) {
    return null;
  }

  const selectedIds = selectedLeads.map((row) => row.id);

  function closeDialog() {
    setOpenDialog(null);
  }

  function handleSuccess() {
    selection.clearSelection();
    setOpenDialog(null);
  }

  return (
    <>
      <div aria-live="polite" className={styles.bar} role="region">
        <p className={styles.summary}>
          {formatSelectedSummary(bulkContent, selection.selectedCount)}
        </p>
        <div className={styles.actions}>
          <ButtonControl
            className={styles.clearButton}
            onClick={() => selection.clearSelection()}
            type="button"
            variant="ghost"
          >
            {bulkContent.toolbar.clear}
          </ButtonControl>
          <ButtonControl
            onClick={() => setOpenDialog(BulkDialogKind.Edit)}
            type="button"
            variant="primary"
          >
            {bulkContent.toolbar.edit}
          </ButtonControl>
          <ButtonControl
            className={styles.archiveButton}
            onClick={() => setOpenDialog(BulkDialogKind.Archive)}
            type="button"
            variant="ghost"
          >
            {bulkContent.toolbar.archive}
          </ButtonControl>
          <button
            className={styles.deleteButton}
            onClick={() => setOpenDialog(BulkDialogKind.Delete)}
            type="button"
          >
            {bulkContent.toolbar.delete}
          </button>
        </div>
      </div>

      {openDialog === BulkDialogKind.Edit ? (
        <LeadsBulkEditDialog
          bulkContent={bulkContent}
          categories={categories}
          onCloseAction={closeDialog}
          onSuccessAction={handleSuccess}
          selectedIds={selectedIds}
          sharedContent={sharedContent}
        />
      ) : null}

      {openDialog === BulkDialogKind.Archive ? (
        <LeadsBulkArchiveConfirmDialog
          bulkContent={bulkContent}
          onCloseAction={closeDialog}
          onSuccessAction={handleSuccess}
          selectedLeads={selectedLeads}
        />
      ) : null}

      {openDialog === BulkDialogKind.Delete ? (
        <LeadsBulkDeleteConfirmDialog
          bulkContent={bulkContent}
          onCloseAction={closeDialog}
          onSuccessAction={handleSuccess}
          selectedLeads={selectedLeads}
        />
      ) : null}
    </>
  );
}
