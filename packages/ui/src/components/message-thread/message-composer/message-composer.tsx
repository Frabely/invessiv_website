"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
  useId,
} from "react";
import { faPaperPlane, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl } from "@invessiv/ui";
import { MESSAGE_BODY_MAX_LENGTH } from "@invessiv/common/constants/crm/message-limits";
import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";
import type { MessageThreadLabels } from "@invessiv/common/contracts/ui/message-thread-labels";
import { useMessageDraft } from "../../../hooks/use-message-draft";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileKindIcon } from "../../files/file-kind-icon/file-kind-icon";
import styles from "./message-composer.module.css";

const COUNTER_THRESHOLD = Math.floor(MESSAGE_BODY_MAX_LENGTH * 0.8);

export type MessageComposerAttachmentsProps = {
  /** Picked entries; a message may be sent with them alone. */
  items: readonly ComposerAttachment[];
  /** Shown above the field while it applies, e.g. that an entry will be released on send. */
  notice: string | null;
  onRemoveAction: (fileId: string) => void;
  /** The consumer's attach control (menu, dialogs); the package knows no upload or file API. */
  trigger: ReactNode;
};

type MessageComposerProps = {
  attachments?: MessageComposerAttachmentsProps;
  draftStorageKey: string;
  labels: Pick<
    MessageThreadLabels,
    | "attachmentsLabel"
    | "characterCount"
    | "inputHint"
    | "inputLabel"
    | "inputPlaceholder"
    | "removeAttachment"
    | "send"
  >;
  onSendAction: (body: string) => void;
};

/** On touch devices Enter stays a line break; only the button sends there. */
function isCoarsePointer(): boolean {
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

export function MessageComposer({
  attachments,
  draftStorageKey,
  labels,
  onSendAction,
}: MessageComposerProps) {
  const [draft, setDraft] = useMessageDraft(draftStorageKey);
  const inputId = useId();
  const hintId = useId();
  const counterId = useId();
  const noticeId = useId();
  const showCounter = draft.length >= COUNTER_THRESHOLD;
  const items = attachments?.items ?? [];
  const canSend = Boolean(draft.trim()) || items.length > 0;
  const describedBy = [
    hintId,
    showCounter ? counterId : null,
    attachments?.notice ? noticeId : null,
  ]
    .filter(Boolean)
    .join(" ");

  function send() {
    if (!canSend) return;
    const body = draft.trim();
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
    <form
      className={styles.composer}
      data-attach={Boolean(attachments)}
      onSubmit={handleSubmit}
    >
      {items.length > 0 ? (
        <ul aria-label={labels.attachmentsLabel} className={styles.chips}>
          {items.map((item) => (
            <li className={styles.chip} key={item.fileId}>
              <FileKindIcon assetKind={item.assetKind} />
              <span className={styles.chipName}>{item.displayName}</span>
              <button
                aria-label={formatMessage(labels.removeAttachment, {
                  name: item.displayName,
                })}
                className={styles.chipRemove}
                onClick={() => attachments?.onRemoveAction(item.fileId)}
                type="button"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {attachments?.notice ? (
        <p className={styles.notice} id={noticeId} role="note">
          {attachments.notice}
        </p>
      ) : null}
      {attachments ? (
        <div className={styles.trigger}>{attachments.trigger}</div>
      ) : null}
      <label className="sr-only" htmlFor={inputId}>
        {labels.inputLabel}
      </label>
      <div className={styles.field} data-value={draft}>
        <textarea
          aria-describedby={describedBy}
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
        disabled={!canSend}
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
