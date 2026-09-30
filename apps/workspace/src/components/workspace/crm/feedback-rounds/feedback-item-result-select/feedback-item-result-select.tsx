"use client";

import { useId } from "react";
import { faHourglassHalf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { CustomSelect } from "@invessiv/ui";
import { FEEDBACK_ITEM_RESULT_BADGES } from "@/common/constants/feedback/feedback-item-result-badges";
import {
  FEEDBACK_RESULT_CHOICE_VALUES,
  FeedbackResultChoice,
} from "@/common/constants/feedback/feedback-result-choices";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./feedback-item-result-select.module.css";

type FeedbackItemResultSelectProps = {
  content: CrmFeedbackRoundsDictionary["result"];
  disabled?: boolean;
  number: number;
  onChangeAction: (result: FeedbackItemResult) => void;
  result: FeedbackItemResult | null;
};

/** The team's result per item; "open" is only offered while no result is set. */
export function FeedbackItemResultSelect({
  content,
  disabled,
  number,
  onChangeAction,
  result,
}: FeedbackItemResultSelectProps) {
  const id = useId();
  const value = result ?? FeedbackResultChoice.Pending;
  const choices = FEEDBACK_RESULT_CHOICE_VALUES.filter(
    (choice) => choice !== FeedbackResultChoice.Pending || result === null,
  );

  return (
    <CustomSelect
      ariaLabel={formatMessage(content.selectLabel, {
        number,
        result: content.choices[value],
      })}
      disabled={disabled}
      id={id}
      onChange={(next) => {
        if (next !== FeedbackResultChoice.Pending && next !== result)
          onChangeAction(next);
      }}
      options={choices.map((choice) => ({
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
