"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  faBolt,
  faCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { LeadSocialProfileDto } from "@invessiv/common/contracts/leads/lead-social-profile.dto";
import type { LeadLatestPitchDto } from "@invessiv/common/contracts/leads/outreach/lead-latest-pitch.dto";
import { LeadPitchJobState } from "@/common/constants/leads/pitch/lead-pitch-job-states";
import { LeadPitchPanelVariant } from "@/common/constants/leads/pitch/lead-pitch-panel-variants";
import { resolveDefaultPitchChannel } from "@/common/patterns/leads/pitch/resolve-pitch-channel";
import type { LeadsPitchDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadPitchPanel } from "../lead-pitch-panel/lead-pitch-panel";
import { useLeadPitchQueue } from "../lead-pitch-queue-provider/lead-pitch-queue-provider";
import styles from "./lead-pitch-row-cell.module.css";

type LeadPitchRowCellProps = {
  content: LeadsPitchDictionary;
  lead: {
    id: string;
    latestPitch: LeadLatestPitchDto | null;
    socialProfiles: LeadSocialProfileDto[];
  };
};

export function LeadPitchRowCell({ content, lead }: LeadPitchRowCellProps) {
  const queue = useLeadPitchQueue();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const channel =
    lead.latestPitch?.channel ??
    resolveDefaultPitchChannel(lead.socialProfiles);
  const job = queue.getJob(lead.id, channel);
  const state =
    job.state === LeadPitchJobState.Idle && lead.latestPitch
      ? LeadPitchJobState.Ready
      : job.state;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        popoverRef.current &&
        event.target instanceof Node &&
        !popoverRef.current.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
  }

  function stopRowNavigation(event: MouseEvent) {
    event.stopPropagation();
  }

  const stateLabel = {
    [LeadPitchJobState.Idle]: content.buttons.generate,
    [LeadPitchJobState.Capturing]: content.states.capturing,
    [LeadPitchJobState.Generating]: content.states.generating,
    [LeadPitchJobState.Ready]: content.states.ready,
    [LeadPitchJobState.Error]: content.states.error,
  }[state];

  const icon =
    state === LeadPitchJobState.Ready
      ? faCheck
      : state === LeadPitchJobState.Error
        ? faTriangleExclamation
        : faBolt;

  return (
    <td className={styles.cell} onClick={stopRowNavigation}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={styles.trigger}
        data-state={state}
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <FontAwesomeIcon aria-hidden="true" icon={icon} />
        <span className={styles.triggerLabel}>{stateLabel}</span>
      </button>

      {isOpen ? (
        <div
          aria-label={content.label}
          className={styles.popover}
          onKeyDown={handleKeyDown}
          ref={popoverRef}
          role="dialog"
        >
          <LeadPitchPanel
            content={content}
            lead={lead}
            variant={LeadPitchPanelVariant.Popover}
          />
        </div>
      ) : null}
    </td>
  );
}
