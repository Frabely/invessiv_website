"use client";

import { type FocusEvent, type MouseEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  faEllipsisVertical,
  faPenToSquare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadOutreachTriggerVariant } from "@invessiv/common/constants/leads/outreach/lead-outreach-trigger-variants";
import { useNavigationContext } from "@/hooks/workspace/use-navigation-context";
import type {
  LeadsDeleteDictionary,
  LeadsOutreachDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadDeleteConfirmDialog } from "../../delete/lead-delete-confirm-dialog/lead-delete-confirm-dialog";
import { LeadOutreachTrigger } from "../../outreach/lead-outreach-trigger/lead-outreach-trigger";
import styles from "./leads-table-row-actions.module.css";

type LeadsTableRowActionsProps = {
  deleteContent: LeadsDeleteDictionary;
  deleteLabel: string;
  editHref: string;
  editLabel: string;
  leadCurrentStatus: ContactLeadStatus;
  leadDisplayName: string;
  leadId: string;
  menuLabel: string;
  outreachContent?: LeadsOutreachDictionary;
};

function stopRowPropagation(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

export function LeadsTableRowActions({
  deleteContent,
  deleteLabel,
  editHref,
  editLabel,
  leadCurrentStatus,
  leadDisplayName,
  leadId,
  menuLabel,
  outreachContent,
}: LeadsTableRowActionsProps) {
  const router = useRouter();
  const startTransition = useNavigationContext();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleCellBlur(event: FocusEvent<HTMLTableCellElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsMenuOpen(false);
    }
  }

  return (
    <td
      className={styles.cell}
      onBlur={handleCellBlur}
      onClick={stopRowPropagation}
      onMouseDown={stopRowPropagation}
    >
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label={menuLabel}
        className={styles.menuTrigger}
        onClick={(event) => {
          stopRowPropagation(event);
          setIsMenuOpen((current) => !current);
        }}
        title={menuLabel}
        type="button"
      >
        <FontAwesomeIcon aria-hidden="true" icon={faEllipsisVertical} />
      </button>
      <div className={styles.group} data-open={isMenuOpen ? "true" : "false"}>
        <button
          aria-label={editLabel}
          className={styles.button}
          onClick={(event) => {
            stopRowPropagation(event);
            setIsMenuOpen(false);
            startTransition(() => router.push(editHref));
          }}
          title={editLabel}
          type="button"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
        </button>
        {outreachContent ? (
          <LeadOutreachTrigger
            content={outreachContent}
            lead={{ displayName: leadDisplayName, id: leadId }}
            onClickCaptureAction={stopRowPropagation}
            variant={LeadOutreachTriggerVariant.IconOnly}
          />
        ) : null}
        <button
          aria-label={deleteLabel}
          className={`${styles.button} ${styles.buttonDestructive}`}
          onClick={(event) => {
            stopRowPropagation(event);
            setIsMenuOpen(false);
            setIsDeleteDialogOpen(true);
          }}
          title={deleteLabel}
          type="button"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faTrash} />
        </button>
      </div>
      {isDeleteDialogOpen ? (
        <LeadDeleteConfirmDialog
          content={deleteContent}
          currentStatus={leadCurrentStatus}
          leadDisplayName={leadDisplayName}
          leadId={leadId}
          onCloseAction={() => setIsDeleteDialogOpen(false)}
        />
      ) : null}
    </td>
  );
}
