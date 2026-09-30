"use client";

import { type KeyboardEvent, useId, useState } from "react";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import { FeedbackAreaRejection } from "@/common/constants/crm/forms/feedback-area-rejections";
import { addFeedbackArea } from "@/common/patterns/crm/feedback-area-list";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./feedback-area-chips.module.css";

type FeedbackAreaChipsProps = {
  areas: readonly string[];
  content: CrmFeedbackRoundsDictionary["handover"];
  disabled: boolean;
  onChangeAction: (areas: string[]) => void;
};

/** Editable area list of a handover: add by button or Enter, remove per chip, at most 30. */
export function FeedbackAreaChips({
  areas,
  content,
  disabled,
  onChangeAction,
}: FeedbackAreaChipsProps) {
  const inputId = useId();
  const hintId = useId();
  const messageId = useId();
  const [draft, setDraft] = useState("");
  const [rejection, setRejection] = useState<FeedbackAreaRejection | null>(
    null,
  );
  const limits = {
    max:
      rejection === FeedbackAreaRejection.TooLong
        ? FEEDBACK_LIMITS.areaLabelMaxLength
        : FEEDBACK_LIMITS.areasPerProject,
  };

  function add() {
    const result = addFeedbackArea(areas, draft);
    if (!result.ok) {
      setRejection(result.rejection);
      return;
    }
    setRejection(null);
    setDraft("");
    onChangeAction(result.areas);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    // Enter adds the area instead of submitting the whole handover.
    event.preventDefault();
    add();
  }

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.legend}>
        {content.areas}
        <span className={styles.count}>
          {formatMessage(content.areaCount, {
            count: areas.length,
            max: FEEDBACK_LIMITS.areasPerProject,
          })}
        </span>
      </legend>
      <p className={styles.hint} id={hintId}>
        {content.areasHint}
      </p>
      {areas.length > 0 ? (
        <ul className={styles.chips}>
          {areas.map((area) => (
            <li className={styles.chip} key={area}>
              <span>{area}</span>
              <button
                aria-label={formatMessage(content.areaRemove, { name: area })}
                className={styles.remove}
                onClick={() =>
                  onChangeAction(areas.filter((item) => item !== area))
                }
                type="button"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.add}>
        <label className="sr-only" htmlFor={inputId}>
          {content.areaInput}
        </label>
        <input
          aria-describedby={`${hintId} ${messageId}`}
          aria-invalid={rejection ? true : undefined}
          className={styles.input}
          id={inputId}
          maxLength={FEEDBACK_LIMITS.areaLabelMaxLength + 1}
          onChange={(event) => {
            setDraft(event.target.value);
            setRejection(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={content.areaInputPlaceholder}
          type="text"
          value={draft}
        />
        <ButtonControl onClick={add} type="button" variant="ghost">
          <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          {content.areaAdd}
        </ButtonControl>
      </div>
      <p
        aria-live="polite"
        className={styles.rejection}
        id={messageId}
        role="status"
      >
        {rejection
          ? formatMessage(content.areaRejections[rejection], limits)
          : null}
      </p>
    </fieldset>
  );
}
