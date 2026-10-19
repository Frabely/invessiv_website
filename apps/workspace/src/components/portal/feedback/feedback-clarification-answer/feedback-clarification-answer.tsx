"use client";

import { type SubmitEvent, useId } from "react";
import { faPaperPlane, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, FormField, PrimaryCtaButton } from "@invessiv/ui";
import {
  FeedbackAnswerProblem,
  type FeedbackAnswerProblem as FeedbackAnswerProblemValue,
} from "@/common/constants/portal/feedback-answer-problems";
import type { FeedbackAnswerDraft } from "@/common/contracts/portal/feedback-answer-draft";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import styles from "./feedback-clarification-answer.module.css";

export type FeedbackClarificationAnswerProps = {
  content: PortalFeedbackDictionary;
  number: number;
  draft: FeedbackAnswerDraft | null;
  onChangeAction: (text: string) => void;
  onSubmitAction: () => void;
  /** Removes a locked draft; only a draft that can no longer be sent offers it. */
  onDiscardAction?: () => void;
};

function problemText(
  problem: FeedbackAnswerProblemValue,
  draft: FeedbackAnswerDraft,
  content: PortalFeedbackDictionary,
): string {
  const texts = content.clarifications.answer;
  switch (problem) {
    case FeedbackAnswerProblem.Required:
      return texts.required;
    case FeedbackAnswerProblem.TooLong:
      return formatMessage(texts.tooLong, {
        max: FEEDBACK_LIMITS.noteMaxLength,
      });
    case FeedbackAnswerProblem.Conflict:
      return texts.conflict;
    case FeedbackAnswerProblem.NotOpen:
      return texts.notOpen;
    default:
      return draft.code
        ? content.errors[draft.code]
        : content.errors.unavailable;
  }
}

/**
 * The customer's answer to the open question on one item. Plain text, no attachments. A question
 * that closed meanwhile keeps the typed text visible and locked, with a way to discard it.
 */
export function FeedbackClarificationAnswer({
  content,
  number,
  draft,
  onChangeAction,
  onSubmitAction,
  onDiscardAction,
}: FeedbackClarificationAnswerProps) {
  const fieldId = useId();
  const texts = content.clarifications.answer;
  const text = draft?.text ?? "";
  const busy = draft?.busy ?? false;
  const locked = draft?.locked ?? false;
  const problem = draft?.problem
    ? problemText(draft.problem, draft, content)
    : undefined;
  const fieldProblem =
    draft?.problem === FeedbackAnswerProblem.Required ||
    draft?.problem === FeedbackAnswerProblem.TooLong;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!busy && !locked) onSubmitAction();
  }

  return (
    <form
      aria-busy={busy}
      className={styles.form}
      noValidate
      onSubmit={handleSubmit}
    >
      <FormField
        errorMessage={fieldProblem ? problem : undefined}
        hint={
          <>
            {locked ? null : <>{texts.hint} </>}
            {formatMessage(texts.counter, {
              count: text.length,
              max: FEEDBACK_LIMITS.noteMaxLength,
            })}
          </>
        }
        kind={FormFieldKind.Textarea}
        label={formatMessage(locked ? texts.staleLabel : texts.label, {
          number,
        })}
        required={!locked}
        textareaProps={{
          // Several answers can be open at once; the name alone would give them one id.
          id: fieldId,
          maxLength: FEEDBACK_LIMITS.noteMaxLength,
          name: "feedback-clarification-answer",
          onChange: (event) => onChangeAction(event.target.value),
          readOnly: busy || locked,
          rows: 3,
          value: text,
        }}
      />
      {problem && !fieldProblem ? (
        <p
          className={styles.message}
          data-problem={draft?.problem}
          role="alert"
        >
          {problem}
        </p>
      ) : null}
      <div className={styles.actions}>
        {locked ? (
          onDiscardAction ? (
            <ButtonControl
              onClick={onDiscardAction}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faTrashCan} />
              {texts.discard}
            </ButtonControl>
          ) : null
        ) : (
          <PrimaryCtaButton disabled={busy} type="submit">
            <FontAwesomeIcon aria-hidden="true" icon={faPaperPlane} />
            {busy ? texts.submitting : texts.submit}
          </PrimaryCtaButton>
        )}
      </div>
    </form>
  );
}
