"use client";

import { type ReactNode, type Ref, useId } from "react";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { findOpenFeedbackClarification } from "@invessiv/common/patterns/crm/find-open-feedback-clarification";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { canAnswerFeedbackClarification } from "@/common/patterns/portal/can-answer-feedback-clarification";
import type { Locale } from "@/config/i18n";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { FeedbackClarificationNotice } from "../feedback-clarification-notice/feedback-clarification-notice";
import { FeedbackItemList } from "../feedback-item-list/feedback-item-list";
import { FeedbackRoundHead } from "../feedback-round-head/feedback-round-head";
import styles from "./feedback-round-step.module.css";

export type FeedbackRoundStepProps = {
  /** What comes after the points: the approval, the quota, a hint for readers. */
  children?: ReactNode;
  content: PortalFeedbackDictionary;
  customerId: string;
  filesContent: PortalFilesDictionary;
  headingRef: Ref<HTMLHeadingElement>;
  /** Keeps the open sheet and its uploads mounted while an earlier round is read. */
  hidden?: boolean;
  locale: Locale;
  /** Where the round stands, between its head and its points. */
  notice: ReactNode;
  round: PortalFeedbackRoundDto;
  /** The editable points of an open round; without it the points are read. */
  sheet?: ReactNode;
  /** Whether this viewer may answer open questions on the points. */
  canSubmit?: boolean;
  onAnnounceAction?: (message: string) => void;
};

/**
 * One round as the step of the page: head, where it stands, open questions, the points (to edit in
 * an open round, to read and answer in any other), then what follows.
 */
export function FeedbackRoundStep({
  children,
  content,
  customerId,
  filesContent,
  headingRef,
  hidden = false,
  locale,
  notice,
  round,
  sheet,
  canSubmit = false,
  onAnnounceAction,
}: FeedbackRoundStepProps) {
  const headingId = useId();
  const itemsId = useId();
  const questioned = round.items.flatMap((item, index) =>
    findOpenFeedbackClarification(item.clarifications)
      ? [{ itemId: item.id, number: index + 1 }]
      : [],
  );
  // Whether an open question of this round takes an answer from this viewer; the notice and the
  // list word the questions accordingly.
  const canAnswer = canAnswerFeedbackClarification(
    canSubmit,
    round.status,
    FeedbackClarificationStatus.Open,
  );

  return (
    <section
      aria-labelledby={headingId}
      className={styles.round}
      hidden={hidden}
    >
      <FeedbackRoundHead
        content={content}
        headingId={headingId}
        headingRef={headingRef}
        locale={locale}
        round={round}
      />
      {notice}
      {sheet ? null : (
        <FeedbackClarificationNotice
          canAnswer={canAnswer}
          content={content}
          items={questioned}
        />
      )}
      {sheet ??
        (round.items.length > 0 ? (
          <section aria-labelledby={itemsId} className={styles.items}>
            <div className={styles.heading}>
              <h3 id={itemsId}>{content.items.headingRead}</h3>
              <span className={styles.count}>
                {formatCountMessage(round.items.length, {
                  one: content.items.countOne,
                  many: content.items.count,
                })}
              </span>
            </div>
            <FeedbackItemList
              content={content}
              customerId={customerId}
              canAnswer={canAnswer}
              filesContent={filesContent}
              locale={locale}
              onAnnounceAction={onAnnounceAction}
              round={round}
            />
          </section>
        ) : null)}
      {children}
    </section>
  );
}
