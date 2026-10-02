"use client";

import { type SubmitEvent, useId, useState } from "react";

import type { OwnBookingUrlDto } from "@invessiv/common/contracts/auth/own-booking-url.dto";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormDialog, FormField } from "@invessiv/ui";
import { AccessFieldLimits } from "@/common/constants/access/access-field-limits";
import type { BookingUrlIssue } from "@/common/constants/access/booking-url-issues";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type { BookingUrlSaveResult } from "@/common/contracts/access/booking-url-save-result";
import { parseBookingUrl } from "@/common/patterns/access/booking-url";
import styles from "./booking-url-dialog.module.css";

export type BookingUrlDialogProps = {
  /** The stored link and the version the first save sends. */
  initial: OwnBookingUrlDto;
  onCloseAction: () => void;
  /** Called after a successful save, before the dialog closes. */
  onSavedAction: () => void;
  /** Writes the link; the caller binds whose link it is and which endpoint stores it. */
  saveAction: (input: OwnBookingUrlDto) => Promise<BookingUrlSaveResult>;
  texts: {
    title: string;
    description: string;
    label: string;
    placeholder: string;
    hint: string;
    submit: string;
    submitting: string;
    cancel: string;
    close: string;
    issues: Record<BookingUrlIssue, string>;
    conflict: string;
    /** Takes `{url}`: the link that is stored after a conflict. */
    conflictCurrent: string;
    conflictCurrentEmpty: string;
    error: string;
  };
};

/**
 * One field for one link. An empty field clears the link. A link the server would reject is
 * named at the field and never sent; on a version conflict the typed link stays and the next
 * save goes against the current version.
 */
export function BookingUrlDialog({
  initial,
  onCloseAction,
  onSavedAction,
  saveAction,
  texts,
}: BookingUrlDialogProps) {
  const formId = useId();
  const [value, setValue] = useState(initial.bookingUrl ?? "");
  const [version, setVersion] = useState(initial.version);
  const [issue, setIssue] = useState<BookingUrlIssue | null>(null);
  const [conflict, setConflict] = useState<OwnBookingUrlDto | null>(null);
  const [failed, setFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const parsed = parseBookingUrl(value);
    setIssue(parsed.ok ? null : parsed.issue);
    if (!parsed.ok) return;

    setIsSubmitting(true);
    setConflict(null);
    setFailed(false);
    const result = await saveAction({ bookingUrl: parsed.value, version });
    if (result.ok) {
      onSavedAction();
      onCloseAction();
      return;
    }
    setIsSubmitting(false);
    if (result.current) {
      setVersion(result.current.version);
      setConflict(result.current);
      return;
    }
    setFailed(true);
  }

  return (
    <FormDialog
      busy={isSubmitting}
      cancelLabel={texts.cancel}
      closeLabel={texts.close}
      description={texts.description}
      formId={formId}
      onCloseAction={onCloseAction}
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
          errorMessage={issue ? texts.issues[issue] : undefined}
          hint={texts.hint}
          inputProps={{
            autoComplete: "off",
            inputMode: "url",
            maxLength: AccessFieldLimits.BookingUrlMaxLength,
            name: "booking-url",
            onChange: (event) => {
              setValue(event.target.value);
              if (issue) setIssue(null);
            },
            placeholder: texts.placeholder,
            spellCheck: false,
            value,
          }}
          kind={FormFieldKind.Url}
          label={texts.label}
        />
        {conflict ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            {texts.conflict}{" "}
            <span className={styles.current}>
              {conflict.bookingUrl
                ? formatMessage(texts.conflictCurrent, {
                    url: conflict.bookingUrl,
                  })
                : texts.conflictCurrentEmpty}
            </span>
          </p>
        ) : null}
        {failed ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Error}
            role="alert"
          >
            {texts.error}
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
}
