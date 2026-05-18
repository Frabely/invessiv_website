"use client";

import { type MouseEvent, useState } from "react";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  LeadOutreachTriggerVariant,
  type LeadOutreachTriggerVariant as LeadOutreachTriggerVariantValue,
} from "@/common/constants/leads/outreach/lead-outreach-trigger-variants";
import type { OutreachLeadFacts } from "@/common/ai-outreach-generation/outreach-lead-facts";
import type { LeadsOutreachDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadOutreachDialog } from "../lead-outreach-dialog/lead-outreach-dialog";
import styles from "./lead-outreach-trigger.module.css";

type LeadOutreachTriggerProps = {
  className?: string;
  content: LeadsOutreachDictionary;
  lead: {
    displayName: string;
    id: string;
    facts?: OutreachLeadFacts;
  };
  onClickCaptureAction?: (event: MouseEvent<HTMLButtonElement>) => void;
  variant: LeadOutreachTriggerVariantValue;
};

export function LeadOutreachTrigger({
  className,
  content,
  lead,
  onClickCaptureAction,
  variant,
}: LeadOutreachTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openRevision, setOpenRevision] = useState(0);
  const isIconOnly = variant === LeadOutreachTriggerVariant.IconOnly;
  const buttonClassName = [
    isIconOnly ? styles.iconButton : styles.textButton,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        aria-label={isIconOnly ? content.triggerLabel : undefined}
        className={buttonClassName}
        onClick={(event) => {
          onClickCaptureAction?.(event);
          setOpenRevision((current) => current + 1);
          setIsOpen(true);
        }}
        title={content.triggerLabel}
        type="button"
      >
        <FontAwesomeIcon aria-hidden="true" icon={faCommentDots} />
        {!isIconOnly ? <span>{content.triggerLabel}</span> : null}
      </button>

      {isOpen ? (
        <LeadOutreachDialog
          content={content}
          leadDisplayName={lead.displayName}
          leadId={lead.id}
          onCloseAction={() => setIsOpen(false)}
          refreshToken={openRevision}
        />
      ) : null}
    </>
  );
}
