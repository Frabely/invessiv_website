"use client";

import { type KeyboardEvent, type SyntheticEvent, useId } from "react";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl } from "@invessiv/ui";
import { MESSAGE_BODY_MAX_LENGTH } from "@invessiv/common/constants/crm/message-limits";
import type { MessageThreadLabels } from "@invessiv/common/contracts/ui/message-thread-labels";
import { useMessageDraft } from "../../../hooks/use-message-draft";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import styles from "./message-composer.module.css";

const COUNTER_THRESHOLD = Math.floor(MESSAGE_BODY_MAX_LENGTH * 0.8);

type MessageComposerProps = {
  draftStorageKey: string;
  labels: Pick<
    MessageThreadLabels,
    "characterCount" | "inputHint" | "inputLabel" | "inputPlaceholder" | "send"
  >;
  onSendAction: (body: string) => void;
};

/** On touch devices Enter stays a line break; only the button sends there. */
function isCoarsePointer(): boolean {
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

export function MessageComposer({
  draftStorageKey,
  labels,
  onSendAction,
}: MessageComposerProps) {
  const [draft, setDraft] = useMessageDraft(draftStorageKey);
  const inputId = useId();
  const hintId = useId();
  const counterId = useId();
  const showCounter = draft.length >= COUNTER_THRESHOLD;

  function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    onSendAction(body);
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    send();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      isCoarsePointer()
    )
      return;
    event.preventDefault();
    send();
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={inputId}>
        {labels.inputLabel}
      </label>
      <div className={styles.field} data-value={draft}>
        <textarea
          aria-describedby={showCounter ? `${hintId} ${counterId}` : hintId}
          id={inputId}
          maxLength={MESSAGE_BODY_MAX_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={labels.inputPlaceholder}
          rows={1}
          value={draft}
        />
      </div>
      <ButtonControl
        aria-label={labels.send}
        className={styles.send}
        disabled={!draft.trim()}
        title={labels.send}
        type="submit"
      >
        <FontAwesomeIcon aria-hidden="true" icon={faPaperPlane} />
      </ButtonControl>
      <p className={styles.meta}>
        <span id={hintId}>{labels.inputHint}</span>
        {showCounter ? (
          <span
            aria-live="polite"
            className={styles.counter}
            data-limit={draft.length >= MESSAGE_BODY_MAX_LENGTH}
            id={counterId}
          >
            {formatMessage(labels.characterCount, {
              count: draft.length,
              max: MESSAGE_BODY_MAX_LENGTH,
            })}
          </span>
        ) : null}
      </p>
    </form>
  );
}
