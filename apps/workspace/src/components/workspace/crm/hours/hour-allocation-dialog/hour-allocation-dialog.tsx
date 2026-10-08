"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, FormDialog, FormField } from "@invessiv/ui";
import { hoursApiService } from "@/client/crm/hours-api-service";
import type { DurationInputError } from "@/common/constants/crm/forms/duration-input-errors";
import { HourAllocationDirection } from "@/common/constants/crm/hour-allocation-directions";
import { readDurationInput } from "@/common/patterns/crm/hours/duration-input";
import { toHourAllocationRequest } from "@/common/patterns/crm/hours/hours-form-request";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { DurationField } from "../duration-field/duration-field";
import styles from "../hours-dialog-form.module.css";

export type HourAllocationDialogProps = {
  content: CrmHoursDictionary;
  customerId: string;
  /** Fixed by the button that opened the dialog; it never flips, not even after a rejection. */
  direction: HourAllocationDirection;
  /** Free minutes of the customer; the ceiling when allocating. */
  freeMinutes: number;
  onCloseAction: () => void;
  projectId: string;
  projectTitle: string;
  /** Unused minutes of the project; the ceiling when releasing. */
  releasableMinutes: number;
};

/**
 * Moves hours between the customer's free stock and one project. Project and direction are fixed;
 * the dialog only asks how much. A rejected request adopts the real figures and keeps the input.
 */
export function HourAllocationDialog({
  content,
  customerId,
  direction,
  freeMinutes,
  onCloseAction,
  projectId,
  projectTitle,
  releasableMinutes,
}: HourAllocationDialogProps) {
  const router = useRouter();
  const formId = useId();
  const durationRef = useRef<HTMLInputElement>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [durationError, setDurationError] = useState<DurationInputError | null>(
    null,
  );
  const [errorCode, setErrorCode] = useState<HoursErrorCode | null>(null);
  const [limits, setLimits] = useState({ freeMinutes, releasableMinutes });
  const [submitting, setSubmitting] = useState(false);

  const text = content.allocationDialog;
  const isRelease = direction === HourAllocationDirection.Release;
  const availableMinutes = Math.max(
    0,
    isRelease ? limits.releasableMinutes : limits.freeMinutes,
  );

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const read = readDurationInput(duration, availableMinutes);
    setDurationError(read.ok ? null : read.error);
    if (!read.ok) {
      durationRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrorCode(null);
    const result = await hoursApiService.createAllocation(
      customerId,
      toHourAllocationRequest({
        idempotencyKey,
        projectId,
        direction,
        minutes: read.minutes,
        note,
      }),
    );
    if (result.ok) {
      router.refresh();
      onCloseAction();
      return;
    }

    setSubmitting(false);
    setErrorCode(result.code);
    if (result.balance && result.project) {
      setLimits({
        freeMinutes: result.balance.freeMinutes,
        releasableMinutes: result.project.releasableMinutes,
      });
    }
  }

  function close() {
    // After a rejected write the figures behind the dialog may be stale.
    if (errorCode) router.refresh();
    onCloseAction();
  }

  return (
    <FormDialog
      busy={submitting}
      cancelLabel={text.cancel}
      closeLabel={text.close}
      description={formatMessage(
        isRelease ? text.descriptionRelease : text.descriptionAllocate,
        { project: projectTitle },
      )}
      formId={formId}
      initialFocusRef={durationRef}
      onCloseAction={close}
      submitLabel={isRelease ? text.submitRelease : text.submitAllocate}
      submittingLabel={text.submitting}
      title={isRelease ? text.titleRelease : text.titleAllocate}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <p className={styles.available}>
          <strong>
            {formatMessage(
              isRelease ? text.availableRelease : text.availableAllocate,
              { duration: formatDuration(availableMinutes) },
            )}
          </strong>
          {availableMinutes > 0 ? (
            <ButtonControl
              onClick={() => setDuration(formatDuration(availableMinutes))}
              type="button"
              variant="quiet"
            >
              {text.useAll}
            </ButtonControl>
          ) : null}
        </p>
        <DurationField
          decreaseLabel={content.duration.decrease}
          errorMessage={
            durationError
              ? formatMessage(content.duration[durationError], {
                  duration: formatDuration(availableMinutes),
                })
              : undefined
          }
          hint={content.duration.hint}
          increaseLabel={content.duration.increase}
          inputRef={durationRef}
          label={text.minutes}
          maxMinutes={availableMinutes}
          name="hour-allocation-duration"
          onChangeAction={setDuration}
          value={duration}
        />
        <FormField
          hint={text.noteHint}
          inputProps={{
            maxLength: HoursLimits.NoteMaxLength,
            name: "hour-allocation-note",
            onChange: (event) => setNote(event.target.value),
            value: note,
          }}
          kind={FormFieldKind.Text}
          label={text.note}
        />
        {errorCode ? (
          <p className={styles.message} role="alert">
            {content.errors[errorCode]}
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
}
