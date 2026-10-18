"use client";

import { useId } from "react";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { useFeedbackDraft } from "@/hooks/portal/use-feedback-draft";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { FeedbackItemAttachments } from "../feedback-item-attachments/feedback-item-attachments";
import { FeedbackItemEditor } from "../feedback-item-editor/feedback-item-editor";
import styles from "./feedback-sheet.module.css";

export type FeedbackSheetProps = {
  canAttach: boolean;
  canUpload: boolean;
  content: PortalFeedbackDictionary;
  customerId: string;
  /** The draft of the round; it lives in the editor, so it survives a look at an earlier round. */
  draft: ReturnType<typeof useFeedbackDraft>;
  filesContent: PortalFilesDictionary;
  /** Shown below the points after a refused submission. */
  formError: string | null;
  /** Points the server found without text on submit. */
  invalidIds: ReadonlySet<string>;
  locale: Locale;
  onAnnounceAction: (message: string) => void;
  onApproveAction: () => void;
  onAttachmentActivityAction: (itemId: string, active: boolean) => void;
  projectId: string;
  /** Rounds that would expire with an approval without changes. */
  remainingRounds: number;
  round: PortalFeedbackRoundDto;
  /** Files are uploading; approving waits for them. */
  uploading: boolean;
};

/** The points of an open round as cards, the way to add one, and the approval when there are none. */
export function FeedbackSheet({
  canAttach,
  canUpload,
  content,
  customerId,
  draft,
  filesContent,
  formError,
  invalidIds,
  locale,
  onAnnounceAction,
  onApproveAction,
  onAttachmentActivityAction,
  projectId,
  remainingRounds,
  round,
  uploading,
}: FeedbackSheetProps) {
  const headingId = useId();
  const full = draft.items.length >= FEEDBACK_LIMITS.itemsPerRound;
  const empty = draft.items.length === 0;

  return (
    <section aria-labelledby={headingId} className={styles.sheet}>
      <div className={styles.heading}>
        <h3 id={headingId}>{content.items.heading}</h3>
        {empty ? null : (
          <span className={styles.count}>
            {formatCountMessage(draft.items.length, {
              one: content.items.countOne,
              many: content.items.count,
            })}
          </span>
        )}
      </div>
      {empty ? (
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
                    onActivityChangeAction={onAttachmentActivityAction}
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
          size={ButtonSize.Control}
          type="button"
          variant={empty ? ButtonVariant.Primary : ButtonVariant.Ghost}
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
      {empty ? (
        <div className={styles.approve}>
          <div className={styles.approveText}>
            <h3>{content.actions.approveTitle}</h3>
            <p>
              {formatCountMessage(remainingRounds, {
                none: content.actions.approveHint,
                one: content.actions.approveHintRoundsOne,
                many: content.actions.approveHintRounds,
              })}
            </p>
          </div>
          <ButtonControl
            disabled={uploading}
            onClick={onApproveAction}
            size={ButtonSize.Control}
            type="button"
            variant={ButtonVariant.Ghost}
          >
            {content.actions.approve}
          </ButtonControl>
        </div>
      ) : null}
    </section>
  );
}
