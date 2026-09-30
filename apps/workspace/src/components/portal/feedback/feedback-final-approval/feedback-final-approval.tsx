"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { faFlagCheckered } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { portalFeedbackApiService } from "@/client/portal/portal-feedback-api-service";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { FeedbackApproveDialog } from "../feedback-approve-dialog/feedback-approve-dialog";
import styles from "./feedback-final-approval.module.css";

export type FeedbackFinalApprovalProps = {
  content: PortalFeedbackDictionary;
  customerId: string;
  /** The latest round, completed; the approval refers to it. */
  round: PortalFeedbackRoundDto;
  /** Further rounds would expire; the approval then is the prominent step only after the last one. */
  hasRemainingRounds: boolean;
  onAnnounceAction: (message: string) => void;
};

/**
 * The customer's approval after a completed round, behind the confirmation dialog. A stale page
 * (the team handed over the next round meanwhile) reloads instead of approving the wrong state.
 */
export function FeedbackFinalApproval({
  content,
  customerId,
  round,
  hasRemainingRounds,
  onAnnounceAction,
}: FeedbackFinalApprovalProps) {
  const router = useRouter();
  const texts = content.finalApproval;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await portalFeedbackApiService.approve(
      customerId,
      round.id,
      round.version,
    );
    setBusy(false);
    if (result.ok) {
      setOpen(false);
      onAnnounceAction(content.announcements.accepted);
      router.refresh();
      return;
    }
    if (result.code === ConcurrencyErrorCode.VersionConflict) {
      setOpen(false);
      router.refresh();
      return;
    }
    setError(content.errors[result.code]);
    router.refresh();
  }

  const trigger = (
    <>
      <FontAwesomeIcon aria-hidden="true" icon={faFlagCheckered} />
      {texts.action}
    </>
  );

  return (
    <div
      className={styles.approval}
      data-prominent={hasRemainingRounds ? "false" : "true"}
    >
      <p className={styles.text}>
        {hasRemainingRounds ? texts.earlyHint : texts.lastHint}
      </p>
      {hasRemainingRounds ? (
        <ButtonControl
          onClick={() => setOpen(true)}
          type="button"
          variant="ghost"
        >
          {trigger}
        </ButtonControl>
      ) : (
        <PrimaryCtaButton onClick={() => setOpen(true)} type="button">
          {trigger}
        </PrimaryCtaButton>
      )}
      {open ? (
        <FeedbackApproveDialog
          busy={busy}
          error={error}
          hasRemainingRounds={hasRemainingRounds}
          onCancelAction={() => setOpen(false)}
          onConfirmAction={() => void approve()}
          texts={content.finalApproveDialog}
        />
      ) : null}
    </div>
  );
}
