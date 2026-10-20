import { type ReactNode, type SubmitEvent, useId, useState } from "react";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { useRouter } from "next/navigation";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormDialog, FormField } from "@invessiv/ui";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";
import type { FeedbackTextDialogDictionary } from "@/common/contracts/crm/feedback-text-dialog-dictionary";
import type { FeedbackTextDialogTexts } from "@/common/contracts/crm/feedback-text-dialog-texts";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import styles from "./feedback-text-dialog.module.css";

export type FeedbackTextDialogProps<TEntity> = {
  common: FeedbackTextDialogDictionary;
  texts: FeedbackTextDialogTexts;
  /** The entity whose version the write sends; a conflict replaces it with the current one. */
  initial: TEntity;
  initialText?: string;
  required: boolean;
  /** A refreshed round can lock the action while its unsent text stays visible. */
  locked?: boolean;
  /** A consequence the team should know before sending, shown above the field. */
  notice?: (current: TEntity) => string | undefined;
  /** Publishes the conflict snapshot to the visible row without replacing the draft. */
  onCurrentAction?: (current: TEntity) => void;
  /** Shows the text the way the customer will read it. */
  preview?: (text: string) => ReactNode;
  errorMessage: (code: FeedbackRoundErrorCode) => string;
  /**
   * `commandId` names this explicit action: it stays for a retry of the same text and changes
   * with the text or after a conflict. Writes without command ids ignore it.
   */
  send: (
    current: TEntity,
    text: string,
    commandId: string,
  ) => Promise<
    VersionedJsonMutationResult<
      TEntity,
      FeedbackRoundErrorCode,
      FeedbackRoundErrorCode
    >
  >;
  onCloseAction: () => void;
  onSavedAction: (saved: TEntity) => void;
};

/**
 * A short plain-text message to the customer, sent with one versioned write. On a conflict the
 * dialog keeps the typed text and sends the next try against the current version.
 */
export function FeedbackTextDialog<TEntity>({
  common,
  texts,
  initial,
  initialText = "",
  required,
  locked = false,
  notice,
  onCurrentAction,
  preview,
  errorMessage,
  send,
  onCloseAction,
  onSavedAction,
}: FeedbackTextDialogProps<TEntity>) {
  const router = useRouter();
  const formId = useId();
  const [text, setText] = useState(initialText);
  const [commandId, setCommandId] = useState(() => crypto.randomUUID());
  const [missing, setMissing] = useState(false);
  const mutation = useVersionedMutation<TEntity, FeedbackRoundErrorCode>(
    initial,
    onCloseAction,
    {
      onConflictAction: (current) => {
        setCommandId(crypto.randomUUID());
        onCurrentAction?.(current);
        router.refresh();
      },
      onErrorAction: (code) => {
        if (code === FeedbackRoundErrorCode.RoundLocked) router.refresh();
      },
    },
  );
  const currentNotice = notice?.(mutation.current);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting || locked) return;
    const trimmed = text.trim();
    setMissing(required && trimmed === "");
    if (required && trimmed === "") return;
    await mutation.submit(async (current) => {
      const result = await send(current, trimmed, commandId);
      if (!result.ok) return result;
      onSavedAction(result.value);
      return { ok: true, current: result.value };
    });
  }

  return (
    <FormDialog
      busy={mutation.isSubmitting}
      cancelLabel={common.cancel}
      closeLabel={common.close}
      description={texts.description}
      formId={formId}
      onCloseAction={mutation.close}
      submitLabel={texts.submit}
      submittingLabel={texts.submitting}
      submitDisabled={locked}
      title={texts.title}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        {currentNotice ? (
          <p className={styles.message} data-tone={DialogMessageTone.Info}>
            {currentNotice}
          </p>
        ) : null}
        <FormField
          errorMessage={missing ? texts.required : undefined}
          hint={
            <>
              {texts.hint}{" "}
              {formatMessage(common.counter, {
                count: text.length,
                max: FEEDBACK_LIMITS.noteMaxLength,
              })}
            </>
          }
          kind={FormFieldKind.Textarea}
          label={texts.label}
          required={required}
          textareaProps={{
            readOnly: mutation.isSubmitting || locked,
            maxLength: FEEDBACK_LIMITS.noteMaxLength,
            name: "feedback-customer-text",
            onChange: (event) => {
              if (mutation.isSubmitting || locked) return;
              setText(event.target.value);
              // A changed text is a new action; only an unchanged retry may reuse the id.
              setCommandId(crypto.randomUUID());
              if (missing && event.target.value.trim()) setMissing(false);
            },
            placeholder: texts.placeholder,
            rows: 4,
            value: text,
          }}
        />
        {preview ? (
          <section aria-label={common.previewLabel} className={styles.preview}>
            <span className={styles.previewLabel}>{common.previewLabel}</span>
            {text.trim() ? (
              preview(text.trim())
            ) : (
              <p className={styles.previewEmpty}>{common.previewEmpty}</p>
            )}
          </section>
        ) : null}
        {mutation.hasConflict ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            {texts.conflict}
          </p>
        ) : null}
        {mutation.errorCode ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Error}
            role="alert"
          >
            {errorMessage(mutation.errorCode)}
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
}
