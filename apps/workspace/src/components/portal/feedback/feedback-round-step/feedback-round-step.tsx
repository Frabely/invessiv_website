"use client";

import { type ReactNode, type Ref, useId } from "react";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import type { Locale } from "@/config/i18n";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
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
};

/**
 * One round as the step of the page: head, where it stands, the points (to edit in an open
 * round, to read in any other), then what follows.
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
}: FeedbackRoundStepProps) {
  const headingId = useId();
  const itemsId = useId();

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
              filesContent={filesContent}
              items={round.items}
              locale={locale}
            />
          </section>
        ) : null)}
      {children}
    </section>
  );
}
