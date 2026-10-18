"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { PrimaryCtaButton } from "@invessiv/ui";
import { portalFeedbackApiService } from "@/client/portal/portal-feedback-api-service";
import {
  FeedbackOpenDialog,
  type FeedbackOpenDialog as FeedbackOpenDialogValue,
} from "@/common/constants/portal/feedback-open-dialog";
import { PortalFeedbackPageState } from "@/common/constants/portal/portal-feedback-page-states";
import { PortalFeedbackRoundResultKind } from "@/common/constants/portal/portal-feedback-round-result-kinds";
import type { PortalFeedbackRoundClientResult } from "@/common/contracts/portal/portal-feedback-client-result";
import { listFeedbackRoundSteps } from "@/common/patterns/portal/feedback-round-steps";
import { portalFeedbackRoundResult } from "@/common/patterns/portal/portal-feedback-round-result";
import { PortalStepBar } from "@/components/portal/shared/portal-step-bar/portal-step-bar";
import { DraftSaveStatus } from "@/components/shared/draft-save-status/draft-save-status";
import type { Locale } from "@/config/i18n";
import { useFeedbackDraft } from "@/hooks/portal/use-feedback-draft";
import { useFeedbackRoundNavigation } from "@/hooks/portal/use-feedback-round-navigation";
import { useActiveItems } from "@/hooks/shared/use-active-items";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { FeedbackApproveDialog } from "../feedback-approve-dialog/feedback-approve-dialog";
import { FeedbackDraftConflict } from "../feedback-draft-conflict/feedback-draft-conflict";
import { FeedbackPageFrame } from "../feedback-page-frame/feedback-page-frame";
import { FeedbackRoundNotice } from "../feedback-round-notice/feedback-round-notice";
import { FeedbackRoundStep } from "../feedback-round-step/feedback-round-step";
import { FeedbackSheet } from "../feedback-sheet/feedback-sheet";
import { FeedbackSubmitDialog } from "../feedback-submit-dialog/feedback-submit-dialog";
import styles from "./feedback-editor.module.css";

export type FeedbackEditorProps = {
  backHref: string;
  canUpload: boolean;
  content: PortalFeedbackDictionary;
  customerId: string;
  feedback: PortalProjectFeedbackDto;
  filesContent: PortalFilesDictionary;
  locale: Locale;
  messagesHref: string | null;
  onAnnounceAction: (message: string) => void;
  /** The open round this contact may edit. */
  round: PortalFeedbackRoundDto;
};

/**
 * The feedback page while the customer is on: the open round as a sheet with autosave, submit
 * and the approval without changes. Earlier rounds stay readable through the track; the draft
 * lives here, so a look back never loses what was typed.
 */
export function FeedbackEditor({
  backHref,
  canUpload,
  content,
  customerId,
  feedback,
  filesContent,
  locale,
  messagesHref,
  onAnnounceAction,
  round,
}: FeedbackEditorProps) {
  const router = useRouter();
  const draft = useFeedbackDraft({
    customerId,
    round,
    leaveWarning: content.draft.leaveWarning,
    onLockedAction: () => router.refresh(),
  });
  const entries = useMemo(() => listFeedbackRoundSteps(feedback), [feedback]);
  const navigation = useFeedbackRoundNavigation(entries, round.roundNumber);
  const [dialog, setDialog] = useState<FeedbackOpenDialogValue | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [invalidIds, setInvalidIds] = useState<ReadonlySet<string>>(new Set());
  const { isActive: uploading, track: trackAttachmentActivity } =
    useActiveItems();
  const editing = navigation.current === round.roundNumber;
  const shown =
    entries.find((entry) => entry.roundNumber === navigation.current)?.round ??
    round;
  const draftRoundLabel = formatMessage(content.round.title, {
    number: round.roundNumber,
  });
  // The open sheet stays keyed and mounted so history navigation cannot cancel its uploads.
  const mountedRounds = editing ? [round] : [round, shown];

  function open(next: FeedbackOpenDialogValue) {
    setDialogError(null);
    setFormError(null);
    setDialog(next);
  }

  /** Saves first, so what is submitted or approved is exactly what the customer sees. */
  async function finish(
    send: (version: number) => Promise<PortalFeedbackRoundClientResult>,
    announcement: string,
  ) {
    if (busy || uploading) return;
    setBusy(true);
    setDialogError(null);
    const saved = await draft.flush();
    if (!saved) {
      setBusy(false);
      setDialog(null);
      return;
    }
    const outcome = portalFeedbackRoundResult(
      await send(draft.currentVersion()),
    );
    setBusy(false);
    if (outcome.kind === PortalFeedbackRoundResultKind.Success) {
      setDialog(null);
      onAnnounceAction(announcement);
      router.refresh();
      return;
    }
    if (outcome.kind === PortalFeedbackRoundResultKind.Conflict) {
      setDialog(null);
      draft.takeConflict(outcome.current);
      return;
    }
    if (outcome.kind === PortalFeedbackRoundResultKind.ItemTextRequired) {
      setDialog(null);
      setInvalidIds(new Set(outcome.itemIds));
      setFormError(content.errors[PortalFeedbackErrorCode.ItemTextRequired]);
      return;
    }
    if (outcome.kind === PortalFeedbackRoundResultKind.Locked) {
      setDialog(null);
      router.refresh();
      return;
    }
    setDialogError(content.errors[outcome.code]);
  }

  return (
    <>
      <FeedbackPageFrame
        backHref={backHref}
        bar={
          <PortalStepBar
            action={
              editing ? (
                <PrimaryCtaButton
                  disabled={draft.items.length === 0 || uploading}
                  onClick={() => open(FeedbackOpenDialog.Submit)}
                  size={ButtonSize.Control}
                  type="button"
                >
                  <FontAwesomeIcon aria-hidden="true" icon={faPaperPlane} />
                  {content.actions.submit}
                </PrimaryCtaButton>
              ) : undefined
            }
            backLabel={content.steps.back}
            nextLabel={
              navigation.next === null
                ? null
                : formatMessage(content.steps.nextTo, {
                    number: navigation.next,
                  })
            }
            onBackAction={
              navigation.previous === null
                ? null
                : () =>
                    navigation.goTo(navigation.previous ?? round.roundNumber)
            }
            onNextAction={() =>
              navigation.goTo(navigation.next ?? round.roundNumber)
            }
            status={
              <div className={styles.draftStatus}>
                {!editing ? (
                  <p className={styles.roundLabel}>{draftRoundLabel}</p>
                ) : null}
                <DraftSaveStatus
                  errorText={
                    draft.errorCode ? content.errors[draft.errorCode] : null
                  }
                  locale={locale}
                  onRetryAction={() => void draft.flush()}
                  saveState={draft.saveState}
                  savedAt={draft.savedAt}
                  savedByName={draft.savedByName}
                  texts={content.draft}
                />
              </div>
            }
          />
        }
        bodyRef={navigation.bodyRef}
        content={content}
        current={navigation.current}
        entries={entries}
        onSelectAction={navigation.goTo}
        projectTitle={feedback.projectTitle}
        quota={feedback.quota}
      >
        {draft.conflictItems ? (
          <section aria-label={draftRoundLabel} className={styles.conflict}>
            {!editing ? (
              <p className={styles.roundLabel}>{draftRoundLabel}</p>
            ) : null}
            <FeedbackDraftConflict
              items={draft.conflictItems}
              onDismissAction={draft.dismissConflict}
              onRestoreAction={() => {
                draft.restoreConflict();
                onAnnounceAction(content.announcements.restored);
              }}
              texts={content.draft.conflict}
            />
          </section>
        ) : null}
        {mountedRounds.map((entry) => (
          <FeedbackRoundStep
            content={content}
            customerId={customerId}
            filesContent={filesContent}
            headingRef={entry.id === shown.id ? navigation.headingRef : null}
            hidden={entry.id !== shown.id}
            key={entry.id}
            locale={locale}
            notice={
              <FeedbackRoundNotice
                contact={feedback.contact}
                content={content}
                latest={entry.id === round.id}
                locale={locale}
                messagesHref={messagesHref}
                round={entry}
                state={PortalFeedbackPageState.Sheet}
              />
            }
            round={entry}
            sheet={
              entry.id === round.id ? (
                <FeedbackSheet
                  canAttach={feedback.canAttach}
                  canUpload={canUpload}
                  content={content}
                  customerId={customerId}
                  draft={draft}
                  filesContent={filesContent}
                  formError={formError}
                  invalidIds={invalidIds}
                  locale={locale}
                  onAnnounceAction={onAnnounceAction}
                  onApproveAction={() => open(FeedbackOpenDialog.Approve)}
                  onAttachmentActivityAction={trackAttachmentActivity}
                  projectId={feedback.projectId}
                  remainingRounds={feedback.quota.remaining}
                  round={round}
                  uploading={uploading}
                />
              ) : undefined
            }
          />
        ))}
      </FeedbackPageFrame>
      {dialog === FeedbackOpenDialog.Submit ? (
        <FeedbackSubmitDialog
          busy={busy}
          content={content}
          error={dialogError}
          items={draft.items}
          onCancelAction={() => setDialog(null)}
          onConfirmAction={() =>
            void finish(
              (version) =>
                portalFeedbackApiService.submit(customerId, round.id, version),
              content.announcements.submitted,
            )
          }
        />
      ) : null}
      {dialog === FeedbackOpenDialog.Approve ? (
        <FeedbackApproveDialog
          busy={busy}
          error={dialogError}
          hasRemainingRounds={feedback.quota.remaining > 0}
          onCancelAction={() => setDialog(null)}
          onConfirmAction={() =>
            void finish(
              (version) =>
                portalFeedbackApiService.approve(customerId, round.id, version),
              content.announcements.approved,
            )
          }
          texts={content.approveDialog}
        />
      ) : null}
    </>
  );
}
