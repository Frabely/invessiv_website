"use client";

import { useId, useState } from "react";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FeedbackResultActorSide } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { FeedbackResultHistoryEventKind } from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";
import type { FeedbackItemResultHistoryEntryDto } from "@invessiv/common/contracts/crm/feedback-item-result-history-entry.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import type { FeedbackResultDictionary } from "@/common/contracts/crm/feedback-result-dictionary";
import { FeedbackItemText } from "@/components/shared/feedback/feedback-item-text/feedback-item-text";
import type { Locale } from "@/config/i18n";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./feedback-result-history.module.css";

type FeedbackResultHistoryProps = {
  entries: readonly FeedbackItemResultHistoryEntryDto[];
  content: FeedbackResultDictionary;
  locale: Locale;
  textLabels: { showMore: string; showLess: string };
};

/** Members stay resolvable; a missing contact name means the portal membership was removed. */
function actorLabel(
  entry: FeedbackItemResultHistoryEntryDto,
  content: FeedbackResultDictionary,
): string {
  if (entry.actorName) return entry.actorName;
  return entry.actorSide === FeedbackResultActorSide.Member
    ? content.history.actorTeam
    : content.history.actorRemoved;
}

export function FeedbackResultHistory({
  entries,
  content,
  locale,
  textLabels,
}: FeedbackResultHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  if (entries.length === 0) return null;
  const texts = content.history;
  return (
    <div className={styles.history}>
      <ButtonControl
        type="button"
        variant="ghost"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(!expanded)}
      >
        <FontAwesomeIcon
          aria-hidden="true"
          className={styles.chevron}
          data-expanded={expanded}
          icon={faChevronDown}
        />
        {formatMessage(texts.toggle, { count: entries.length })}
      </ButtonControl>
      <ol className={styles.entries} hidden={!expanded} id={id}>
        {[...entries]
          .sort((a, b) => a.itemVersion - b.itemVersion)
          .map((entry) => (
            <li className={styles.entry} key={entry.id}>
              <div className={styles.meta}>
                <time dateTime={entry.occurredAt}>
                  {formatMomentDay(entry.occurredAt, locale)}
                </time>
                <span>{actorLabel(entry, content)}</span>
              </div>
              <p className={styles.event}>
                {entry.kind === FeedbackResultHistoryEventKind.Reset
                  ? texts.reset
                  : formatMessage(texts[entry.kind], {
                      result: entry.result
                        ? content.choices[entry.result]
                        : content.choices.pending,
                    })}
              </p>
              {entry.resultNote ? (
                <FeedbackItemText text={entry.resultNote} labels={textLabels} />
              ) : null}
            </li>
          ))}
      </ol>
    </div>
  );
}
