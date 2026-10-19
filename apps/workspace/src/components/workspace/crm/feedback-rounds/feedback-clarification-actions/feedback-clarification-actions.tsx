"use client";

import { type Ref, useState } from "react";
import { faCircleQuestion, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import { findOpenFeedbackClarification } from "@invessiv/common/patterns/crm/find-open-feedback-clarification";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import { feedbackRoundsApiService } from "@/client/crm/feedback-rounds-api-service";
import { feedbackProcessingError } from "@/common/patterns/crm/feedback-processing-error";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FeedbackTextDialog } from "../feedback-text-dialog/feedback-text-dialog";
import styles from "./feedback-clarification-actions.module.css";

type FeedbackClarificationActionsProps = {
  content: CrmFeedbackRoundsDictionary;
  item: FeedbackRoundItemDto;
  number: number;
  onAnnounceAction: (message: string) => void;
  /** The row keeps the focus on this action across the refresh after a write. */
  buttonRef: Ref<HTMLButtonElement>;
  onSavedAction: (saved: FeedbackRoundItemDto) => void;
};

/**
 * Asks a question on an item without an open one, or closes the open one with a note. Both go
 * through the generic text dialog. The dialog keeps the question it was opened for, so a refresh
 * behind it never turns closing into asking; the server decides whether the item still allows it.
 */
export function FeedbackClarificationActions({
  content,
  item,
  number,
  onAnnounceAction,
  buttonRef,
  onSavedAction,
}: FeedbackClarificationActionsProps) {
  const texts = content.clarification;
  const [asking, setAsking] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const open = findOpenFeedbackClarification(item.clarifications);

  const errorMessage = (code: FeedbackRoundErrorCode) =>
    content.processingErrors[feedbackProcessingError(code)];

  function saved(message: string, entity: FeedbackRoundItemDto) {
    onAnnounceAction(formatMessage(message, { number }));
    onSavedAction(entity);
  }

  function openDialog() {
    if (open) setClosingId(open.id);
    else setAsking(true);
  }

  const { resultNotice, ...askTexts } = texts.askDialog;

  return (
    <div className={styles.actions}>
      <ButtonControl
        aria-label={formatMessage(open ? texts.closeNamed : texts.askNamed, {
          number,
        })}
        onClick={openDialog}
        ref={buttonRef}
        type="button"
        variant="ghost"
      >
        <FontAwesomeIcon
          aria-hidden="true"
          icon={open ? faXmark : faCircleQuestion}
        />
        {open ? texts.close : texts.ask}
      </ButtonControl>
      {closingId ? (
        <FeedbackTextDialog<FeedbackRoundItemDto>
          common={content.textDialog}
          errorMessage={errorMessage}
          initial={item}
          onCloseAction={() => setClosingId(null)}
          onSavedAction={(entity) =>
            saved(content.announcements.clarificationClosed, entity)
          }
          required
          send={async (current, note, commandId) =>
            // After a conflict the current item may show the question finished; no request then.
            findOpenFeedbackClarification(current.clarifications)?.id !==
            closingId
              ? { ok: false, code: FeedbackRoundErrorCode.ClarificationNotOpen }
              : feedbackRoundsApiService.closeClarification(
                  current.id,
                  closingId,
                  { commandId, version: current.version, note },
                )
          }
          texts={{
            ...texts.closeDialog,
            title: formatMessage(texts.closeDialog.title, { number }),
          }}
        />
      ) : null}
      {asking ? (
        <FeedbackTextDialog<FeedbackRoundItemDto>
          common={content.textDialog}
          errorMessage={errorMessage}
          initial={item}
          notice={
            item.result
              ? formatMessage(resultNotice, {
                  result: content.result.choices[item.result],
                })
              : undefined
          }
          onCloseAction={() => setAsking(false)}
          onSavedAction={(entity) =>
            saved(content.announcements.clarificationAsked, entity)
          }
          required
          send={async (current, question, commandId) =>
            findOpenFeedbackClarification(current.clarifications)
              ? { ok: false, code: FeedbackRoundErrorCode.ClarificationOpen }
              : feedbackRoundsApiService.askClarification(current.id, {
                  commandId,
                  version: current.version,
                  question,
                })
          }
          texts={{
            ...askTexts,
            title: formatMessage(askTexts.title, { number }),
          }}
        />
      ) : null}
    </div>
  );
}
