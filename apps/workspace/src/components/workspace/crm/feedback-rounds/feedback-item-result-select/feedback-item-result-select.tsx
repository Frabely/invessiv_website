"use client";

import { useId } from "react";
import {
  faCircleQuestion,
  faHourglassHalf,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackItemProcessingState } from "@invessiv/common/constants/crm/feedback-item-processing-states";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { CustomSelect } from "@invessiv/ui";
import { FEEDBACK_ITEM_RESULT_BADGES } from "@/common/constants/feedback/feedback-item-result-badges";
import {
  FEEDBACK_RESULT_CHOICE_VALUES,
  FeedbackResultChoice,
} from "@/common/constants/feedback/feedback-result-choices";
import type { FeedbackResultDictionary } from "@/common/contracts/crm/feedback-result-dictionary";
import styles from "./feedback-item-result-select.module.css";

type FeedbackItemResultSelectProps = {
  content: FeedbackResultDictionary;
  disabled?: boolean;
  /** An open clarification: the select reads "Question" and explains when a result is possible. */
  locked?: boolean;
  number: number;
  onChangeAction: (result: FeedbackItemResult | null) => void;
  result: FeedbackItemResult | null;
};

/** The team's result per item, including resetting an existing result to pending. */
export function FeedbackItemResultSelect({
  content,
  disabled,
  locked = false,
  number,
  onChangeAction,
  result,
}: FeedbackItemResultSelectProps) {
  const id = useId();
  const hintId = useId();

  if (locked) {
    const value = FeedbackItemProcessingState.Clarification;
    return (
      <div className={styles.locked}>
        <CustomSelect
          ariaLabel={formatMessage(content.selectLabel, {
            number,
            result: content.choices[value],
          })}
          describedBy={hintId}
          disabled
          id={id}
          onChange={() => undefined}
          options={[
            {
              label: content.choices[value],
              leading: (
                <span className={styles.icon} data-result={value}>
                  <FontAwesomeIcon aria-hidden="true" icon={faCircleQuestion} />
                </span>
              ),
              value,
            },
          ]}
          value={value}
        />
        <p className={styles.hint} id={hintId}>
          {content.lockedHint}
        </p>
      </div>
    );
  }

  const value = result ?? FeedbackResultChoice.Pending;
  return (
    <CustomSelect
      ariaLabel={formatMessage(content.selectLabel, {
        number,
        result: content.choices[value],
      })}
      disabled={disabled}
      id={id}
      onChange={(next) => {
        const chosen = next === FeedbackResultChoice.Pending ? null : next;
        if (chosen !== result) onChangeAction(chosen);
      }}
      options={FEEDBACK_RESULT_CHOICE_VALUES.map((choice) => ({
        label: content.choices[choice],
        leading: (
          <span className={styles.icon} data-result={choice}>
            <FontAwesomeIcon
              aria-hidden="true"
              icon={
                choice === FeedbackResultChoice.Pending
                  ? faHourglassHalf
                  : FEEDBACK_ITEM_RESULT_BADGES[choice].icon
              }
            />
          </span>
        ),
        value: choice,
      }))}
      value={value}
    />
  );
}
