"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, PrimaryCtaButton } from "@invessiv/ui";
import { portalFeedbackApiService } from "@/client/portal/portal-feedback-api-service";
import {
  FeedbackOpenDialog,
  type FeedbackOpenDialog as FeedbackOpenDialogValue,
} from "@/common/constants/portal/feedback-open-dialog";
import { PortalFeedbackRoundResultKind } from "@/common/constants/portal/portal-feedback-round-result-kinds";
import type { PortalFeedbackRoundClientResult } from "@/common/contracts/portal/portal-feedback-client-result";
import { portalFeedbackRoundResult } from "@/common/patterns/portal/portal-feedback-round-result";
import type { Locale } from "@/config/i18n";
import { useFeedbackDraft } from "@/hooks/portal/use-feedback-draft";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { FeedbackApproveDialog } from "../feedback-approve-dialog/feedback-approve-dialog";
import { FeedbackDraftStatus } from "../feedback-draft-status/feedback-draft-status";
import { FeedbackItemAttachments } from "../feedback-item-attachments/feedback-item-attachments";
import { FeedbackItemEditor } from "../feedback-item-editor/feedback-item-editor";
import { FeedbackSubmitDialog } from "../feedback-submit-dialog/feedback-submit-dialog";
import styles from "./feedback-sheet.module.css";

export type FeedbackSheetProps = {
  canAttach: boolean;
  canUpload: boolean;
  content: PortalFeedbackDictionary;
  customerId: string;
  filesContent: PortalFilesDictionary;
  /** Other rounds would expire on approval. */
  hasRemainingRounds: boolean;
  locale: Locale;
  onAnnounceAction: (message: string) => void;
  projectId: string;
  /** An open round this contact may edit. */
  round: PortalFeedbackRoundDto;
};

/** The feedback form of an open round: points, files, autosave, submit and approval. */
export function FeedbackSheet({
  canAttach,
  canUpload,
  content,
  customerId,
  filesContent,
  hasRemainingRounds,
  locale,
  onAnnounceAction,
  projectId,
  round,
}: FeedbackSheetProps) {
  const router = useRouter();
  const draft = useFeedbackDraft({
    customerId,
    round,
    leaveWarning: content.draft.leaveWarning,
    onLockedAction: () => router.refresh(),
  });
  const [dialog, setDialog] = useState<FeedbackOpenDialogValue | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [invalidIds, setInvalidIds] = useState<ReadonlySet<string>>(new Set());
  const [activeAttachments, setActiveAttachments] = useState<
    ReadonlySet<string>
  >(new Set());
  const full = draft.items.length >= FEEDBACK_LIMITS.itemsPerRound;

  const trackAttachmentActivity = useCallback(
    (itemId: string, active: boolean) => {
      setActiveAttachments((current) => {
        if (current.has(itemId) === active) return current;
        const next = new Set(current);
        if (active) next.add(itemId);
        else next.delete(itemId);
        return next;
      });
    },
    [],
  );

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
    if (busy || activeAttachments.size > 0) return;
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
    <div className={styles.sheet}>
      <p className={styles.visible}>{content.intro.draftVisible}</p>
      {draft.items.length === 0 ? (
        <p className={styles.empty}>{content.editor.empty}</p>
      ) : (
        <ol aria-label={content.editor.listLabel} className={styles.items}>
          {draft.items.map((item, index) => (
            <FeedbackItemEditor
              areaOptions={round.areaOptions}
              attachments={
                canAttach || item.attachments.length > 0 ? (
                  <FeedbackItemAttachments
                    canAttach={canAttach}
                    canUpload={canUpload}
                    content={content}
                    customerId={customerId}
                    filesContent={filesContent}
                    flushAction={draft.flush}
                    item={item}
                    locale={locale}
                    number={index + 1}
                    onAnnounceAction={onAnnounceAction}
                    onChangeAction={(update) =>
                      draft.setAttachments(item.id, update)
                    }
                    onActivityChangeAction={trackAttachmentActivity}
                    projectId={projectId}
                    roundId={round.id}
                  />
                ) : undefined
              }
              content={content}
              invalid={invalidIds.has(item.id) && item.body.trim() === ""}
              item={item}
              key={item.id}
              number={index + 1}
              onChangeAction={(patch) => draft.updateItem(item.id, patch)}
              onRemoveAction={() => draft.removeItem(item.id)}
            />
          ))}
        </ol>
      )}
      <div className={styles.add}>
        <ButtonControl
          disabled={full}
          onClick={draft.addItem}
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          {content.editor.add}
        </ButtonControl>
        {full ? (
          <p className={styles.hint}>
            {formatMessage(content.editor.limit, {
              max: FEEDBACK_LIMITS.itemsPerRound,
            })}
          </p>
        ) : null}
      </div>
      {formError ? (
        <p className={styles.error} role="alert">
          {formError}
        </p>
      ) : null}
      <div className={styles.bar}>
        <FeedbackDraftStatus
          conflictItems={draft.conflictItems}
          content={content}
          errorCode={draft.errorCode}
          locale={locale}
          onDismissConflictAction={draft.dismissConflict}
          onRestoreConflictAction={() => {
            draft.restoreConflict();
            onAnnounceAction(content.announcements.restored);
          }}
          onRetryAction={() => void draft.flush()}
          saveState={draft.saveState}
          savedAt={draft.savedAt}
          savedByName={draft.savedByName}
        />
        <div className={styles.actions}>
          <ButtonControl
            onClick={() => void draft.flush()}
            type="button"
            variant="ghost"
          >
            {content.actions.saveNow}
          </ButtonControl>
          <PrimaryCtaButton
            disabled={draft.items.length === 0 || activeAttachments.size > 0}
            onClick={() => open(FeedbackOpenDialog.Submit)}
            type="button"
          >
            {content.actions.submit}
          </PrimaryCtaButton>
        </div>
      </div>
      {draft.items.length === 0 ? (
        <p className={styles.approve}>
          <span>{content.actions.approveHint}</span>
          <ButtonControl
            disabled={activeAttachments.size > 0}
            onClick={() => open(FeedbackOpenDialog.Approve)}
            type="button"
            variant="ghost"
          >
            {content.actions.approve}
          </ButtonControl>
        </p>
      ) : null}
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
          hasRemainingRounds={hasRemainingRounds}
          onCancelAction={() => setDialog(null)}
          texts={content.approveDialog}
          onConfirmAction={() =>
            void finish(
              (version) =>
                portalFeedbackApiService.approve(customerId, round.id, version),
              content.announcements.approved,
            )
          }
        />
      ) : null}
    </div>
  );
}
