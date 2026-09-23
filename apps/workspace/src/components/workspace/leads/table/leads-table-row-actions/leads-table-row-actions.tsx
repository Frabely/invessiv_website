"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  faEllipsisVertical,
  faPenToSquare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadOutreachTriggerVariant } from "@invessiv/common/constants/leads/outreach/lead-outreach-trigger-variants";
import { TableRowActions } from "@invessiv/ui";
import type {
  LeadsDeleteDictionary,
  LeadsOutreachDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadDeleteConfirmDialog } from "../../delete/lead-delete-confirm-dialog/lead-delete-confirm-dialog";
import { LeadOutreachTrigger } from "../../outreach/lead-outreach-trigger/lead-outreach-trigger";
import styles from "./leads-table-row-actions.module.css";

type LeadsTableRowActionsProps = {
  canDelete: boolean;
  canEdit: boolean;
  deleteContent: LeadsDeleteDictionary;
  deleteLabel: string;
  editHref: string;
  editLabel: string;
  leadCurrentStatus: ContactLeadStatus;
  leadDisplayName: string;
  leadId: string;
  menuLabel: string;
  mobileCardSlot?: "actions";
  outreachContent?: LeadsOutreachDictionary;
};

export function LeadsTableRowActions({
  canDelete,
  canEdit,
  deleteContent,
  deleteLabel,
  editHref,
  editLabel,
  leadCurrentStatus,
  leadDisplayName,
  leadId,
  menuLabel,
  mobileCardSlot,
  outreachContent,
}: LeadsTableRowActionsProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!canEdit && !canDelete && !outreachContent) {
    return (
      <td className={styles.cell} data-mobile-card-slot={mobileCardSlot} />
    );
  }

  return (
    <>
      <TableRowActions
        className={styles.cell}
        isPinned
        menuIcon={
          <FontAwesomeIcon aria-hidden="true" icon={faEllipsisVertical} />
        }
        menuLabel={menuLabel}
        mobileCardSlot={mobileCardSlot}
      >
        {canEdit ? (
          <button
            aria-label={editLabel}
            onClick={() => router.push(editHref)}
            title={editLabel}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
          </button>
        ) : null}
        {outreachContent ? (
          <LeadOutreachTrigger
            content={outreachContent}
            lead={{ displayName: leadDisplayName, id: leadId }}
            variant={LeadOutreachTriggerVariant.IconOnly}
          />
        ) : null}
        {canDelete ? (
          <button
            aria-label={deleteLabel}
            data-tone="danger"
            onClick={() => setIsDeleteDialogOpen(true)}
            title={deleteLabel}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faTrash} />
          </button>
        ) : null}
      </TableRowActions>
      {canDelete && isDeleteDialogOpen ? (
        <LeadDeleteConfirmDialog
          canArchive={canEdit}
          content={deleteContent}
          currentStatus={leadCurrentStatus}
          leadDisplayName={leadDisplayName}
          leadId={leadId}
          onCloseAction={() => setIsDeleteDialogOpen(false)}
        />
      ) : null}
    </>
  );
}
