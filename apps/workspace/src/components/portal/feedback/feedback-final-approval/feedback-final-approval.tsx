"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { faFlagCheckered } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { portalFeedbackApiService } from "@/client/portal/portal-feedback-api-service";
import { PortalFeedbackRoundResultKind } from "@/common/constants/portal/portal-feedback-round-result-kinds";
import { portalFeedbackRoundResult } from "@/common/patterns/portal/portal-feedback-round-result";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { FeedbackApproveDialog } from "../feedback-approve-dialog/feedback-approve-dialog";
import styles from "./feedback-final-approval.module.css";

export type FeedbackFinalApprovalProps = {
  content: PortalFeedbackDictionary;
  customerId: string;
  onAnnounceAction: (message: string) => void;
  /** Rounds that would expire with the approval; 0 after the last one. */
  remainingRounds: number;
  /** The latest round, completed; the approval refers to it. */
  round: PortalFeedbackRoundDto;
};

/**
 * The customer's approval after a completed round, behind the confirmation dialog. With rounds
 * left it is a quiet section that says how many expire; after the last round it is the main
 * action of the page and sits in the bar. A stale page (the team handed over the next round
 * meanwhile) reloads instead of approving the wrong state.
 */
export function FeedbackFinalApproval({
  content,
  customerId,
  onAnnounceAction,
  remainingRounds,
  round,
}: FeedbackFinalApprovalProps) {
  const router = useRouter();
  const titleId = useId();
  const texts = content.finalApproval;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const early = remainingRounds > 0;

  async function approve() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const outcome = portalFeedbackRoundResult(
      await portalFeedbackApiService.approve(
        customerId,
        round.id,
        round.version,
      ),
    );
    setBusy(false);
    if (outcome.kind === PortalFeedbackRoundResultKind.Success) {
      setOpen(false);
      onAnnounceAction(content.announcements.accepted);
      router.refresh();
      return;
    }
    if (outcome.kind === PortalFeedbackRoundResultKind.Conflict) {
      setOpen(false);
      router.refresh();
      return;
    }
    if (outcome.kind === PortalFeedbackRoundResultKind.ItemTextRequired) {
      setError(content.errors[PortalFeedbackErrorCode.ItemTextRequired]);
      router.refresh();
      return;
    }
    if (outcome.kind === PortalFeedbackRoundResultKind.Locked) {
      setError(content.errors[PortalFeedbackErrorCode.Locked]);
      router.refresh();
      return;
    }
    setError(content.errors[outcome.code]);
    router.refresh();
  }

  const dialog = open ? (
    <FeedbackApproveDialog
      busy={busy}
      error={error}
      hasRemainingRounds={early}
      onCancelAction={() => setOpen(false)}
      onConfirmAction={() => void approve()}
      texts={content.finalApproveDialog}
    />
  ) : null;

  if (!early)
    return (
      <>
        <PrimaryCtaButton
          onClick={() => setOpen(true)}
          size={ButtonSize.Control}
          type="button"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faFlagCheckered} />
          {texts.action}
        </PrimaryCtaButton>
        {dialog}
      </>
    );

  return (
    <section aria-labelledby={titleId} className={styles.approval}>
      <div className={styles.text}>
        <h3 id={titleId}>{texts.earlyTitle}</h3>
        <p>
          {formatCountMessage(remainingRounds, {
            one: texts.earlyHintOne,
            many: texts.earlyHint,
          })}
        </p>
      </div>
      <ButtonControl
        onClick={() => setOpen(true)}
        size={ButtonSize.Control}
        type="button"
        variant={ButtonVariant.Ghost}
      >
        <FontAwesomeIcon aria-hidden="true" icon={faFlagCheckered} />
        {texts.action}
      </ButtonControl>
      {dialog}
    </section>
  );
}
