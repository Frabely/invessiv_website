import { type ReactNode, type SubmitEvent, useId, useState } from "react";
import type { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormDialog, FormField } from "@invessiv/ui";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./feedback-text-dialog.module.css";

type TextDialogKey =
  | "title"
  | "description"
  | "label"
  | "hint"
  | "placeholder"
  | "submit"
  | "submitting"
  | "required"
  | "conflict";

export type FeedbackTextDialogProps<TEntity> = {
  common: CrmFeedbackRoundsDictionary["textDialog"];
  texts: Record<TextDialogKey, string>;
  /** The entity whose version the write sends; a conflict replaces it with the current one. */
  initial: TEntity;
  initialText?: string;
  required: boolean;
  /** Shows the text the way the customer will read it. */
  preview?: (text: string) => ReactNode;
  errorMessage: (code: FeedbackRoundErrorCode) => string;
  send: (
    current: TEntity,
    text: string,
  ) => Promise<VersionedJsonMutationResult<TEntity, FeedbackRoundErrorCode>>;
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
  preview,
  errorMessage,
  send,
  onCloseAction,
  onSavedAction,
}: FeedbackTextDialogProps<TEntity>) {
  const formId = useId();
  const [text, setText] = useState(initialText);
  const [missing, setMissing] = useState(false);
  const mutation = useVersionedMutation<TEntity, FeedbackRoundErrorCode>(
    initial,
    onCloseAction,
  );

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) return;
    const trimmed = text.trim();
    setMissing(required && trimmed === "");
    if (required && trimmed === "") return;
    await mutation.submit(async (current) => {
      const result = await send(current, trimmed);
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
      title={texts.title}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
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
            maxLength: FEEDBACK_LIMITS.noteMaxLength,
            name: "feedback-customer-text",
            onChange: (event) => {
              setText(event.target.value);
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
