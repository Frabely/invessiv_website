"use client";

import type { MouseEvent } from "react";
import {
  faArrowDown,
  faCircleQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonLink } from "@invessiv/ui";
import { FeedbackNoticeTone } from "@/common/constants/portal/feedback-notice-tones";
import { feedbackItemDomId } from "@/common/patterns/portal/feedback-item-dom-id";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { FeedbackStateNotice } from "../feedback-state-notice/feedback-state-notice";
import styles from "./feedback-clarification-notice.module.css";

export type FeedbackClarificationNoticeProps = {
  /** Whether this viewer can answer; readers and the owner view are told who can. */
  canAnswer: boolean;
  content: PortalFeedbackDictionary;
  /** Items with an open question, in list order, with their visible number. */
  items: readonly { itemId: string; number: number }[];
};

function jump(event: MouseEvent<HTMLAnchorElement>, itemId: string) {
  const target = document.getElementById(feedbackItemDomId(itemId));
  if (!target) return;
  // The hash alone would not move the focus; focusing the heading also scrolls the page body to it.
  event.preventDefault();
  target.focus();
}

/**
 * Above the items: how many questions wait for the customer, with a link to each item. The links
 * move the focus to the item heading and leave the order of the items as it is.
 */
export function FeedbackClarificationNotice({
  canAnswer,
  content,
  items,
}: FeedbackClarificationNoticeProps) {
  const texts = content.clarifications;
  if (items.length === 0) return null;

  return (
    <FeedbackStateNotice
      description={canAnswer ? texts.noticeHint : texts.noticeHintReadOnly}
      icon={faCircleQuestion}
      title={formatCountMessage(items.length, {
        one: texts.noticeOne,
        many: texts.notice,
      })}
      tone={FeedbackNoticeTone.Warm}
    >
      <nav aria-label={texts.jumpLabel}>
        <ul className={styles.links}>
          {items.map(({ itemId, number }) => (
            <li key={itemId}>
              <ButtonLink
                href={`#${feedbackItemDomId(itemId)}`}
                onClick={(event) => jump(event, itemId)}
                variant="ghost"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faArrowDown} />
                {formatMessage(texts.jumpTo, { number })}
              </ButtonLink>
            </li>
          ))}
        </ul>
      </nav>
    </FeedbackStateNotice>
  );
}
