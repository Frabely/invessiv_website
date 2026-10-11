"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import {
  HOUR_PURCHASE_KIND_VALUES,
  HourPurchaseKind,
} from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { CustomSelect, FormDialog, FormField } from "@invessiv/ui";
import { hoursApiService } from "@/client/crm/hours-api-service";
import type { DurationInputError } from "@/common/constants/crm/forms/duration-input-errors";
import { readDurationInput } from "@/common/patterns/crm/hours/duration-input";
import { toHourPurchaseRequest } from "@/common/patterns/crm/hours/hours-form-request";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { DurationField } from "../duration-field/duration-field";
import styles from "../hours-dialog-form.module.css";

export type HourPurchaseDialogProps = {
  balance: CustomerHoursBalanceDto;
  content: CrmHoursDictionary;
  customerId: string;
  onCloseAction: () => void;
  /** Business day: default of the date field and its upper bound. */
  today: string;
};

/**
 * Adds purchased hours or deducts them again. Every submit writes its own immutable line, so the
 * idempotency key is created once per dialog: a double click or a retry stays the same write.
 */
export function HourPurchaseDialog({
  balance,
  content,
  customerId,
  onCloseAction,
  today,
}: HourPurchaseDialogProps) {
  const router = useRouter();
  const formId = useId();
  const durationRef = useRef<HTMLDivElement>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [kind, setKind] = useState<HourPurchaseKind>(HourPurchaseKind.Purchase);
  const [duration, setDuration] = useState("");
  const [purchasedOn, setPurchasedOn] = useState(today);
  const [note, setNote] = useState("");
  const [durationError, setDurationError] = useState<DurationInputError | null>(
    null,
  );
  const [dateInvalid, setDateInvalid] = useState(false);
  const [errorCode, setErrorCode] = useState<HoursErrorCode | null>(null);
  // A rejected correction answers with the real figures; the dialog then shows those.
  const [current, setCurrent] = useState(balance);
  const [submitting, setSubmitting] = useState(false);

  const text = content.purchaseDialog;
  const isCorrection = kind === HourPurchaseKind.Correction;
  // Only hours that are not allocated to a project can be taken away again.
  const deductibleMinutes = Math.max(0, current.freeMinutes);
  const maxMinutes = isCorrection
    ? deductibleMinutes
    : HoursLimits.MaxLedgerMinutes;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const read = readDurationInput(duration, maxMinutes);
    const invalidDate = purchasedOn === "" || purchasedOn > today;
    setDurationError(read.ok ? null : read.error);
    setDateInvalid(invalidDate);
    if (!read.ok || invalidDate) {
      if (!read.ok) durationRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrorCode(null);
    const result = await hoursApiService.createPurchase(
      customerId,
      toHourPurchaseRequest({
        idempotencyKey,
        kind,
        minutes: read.minutes,
        purchasedOn,
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
    if (result.balance) setCurrent(result.balance);
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
      description={text.description}
      formId={formId}
      initialFocusRef={durationRef}
      onCloseAction={close}
      submitLabel={isCorrection ? text.submitCorrection : text.submitPurchase}
      submittingLabel={text.submitting}
      title={text.title}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        {deductibleMinutes > 0 ? (
          <FormField
            kind={FormFieldKind.Custom}
            label={text.kind}
            renderControl={({ describedBy, id, invalid }) => (
              <CustomSelect
                describedBy={describedBy}
                id={id}
                invalid={invalid}
                onChange={(next) => setKind(next as HourPurchaseKind)}
                options={HOUR_PURCHASE_KIND_VALUES.map((value) => ({
                  label:
                    value === HourPurchaseKind.Correction
                      ? text.kindCorrection
                      : text.kindPurchase,
                  value,
                }))}
                value={kind}
              />
            )}
          />
        ) : null}
        <DurationField
          decreaseLabel={content.duration.decrease}
          decreaseHoursLabel={content.duration.decreaseHours}
          increaseHoursLabel={content.duration.increaseHours}
          hoursLabel={content.duration.hours}
          minutesLabel={content.duration.minutes}
          errorMessage={
            durationError
              ? formatMessage(content.duration[durationError], {
                  duration: formatDuration(maxMinutes),
                })
              : undefined
          }
          hint={
            isCorrection
              ? formatMessage(text.correctionLimit, {
                  duration: formatDuration(deductibleMinutes),
                })
              : content.duration.hint
          }
          increaseLabel={content.duration.increase}
          focusRef={durationRef}
          label={text.minutes}
          maxMinutes={maxMinutes}
          name="hour-purchase-duration"
          onChangeAction={setDuration}
          value={duration}
        />
        <FormField
          errorMessage={dateInvalid ? text.futureDate : undefined}
          inputProps={{
            max: today,
            name: "hour-purchase-date",
            onChange: (event) => setPurchasedOn(event.target.value),
            value: purchasedOn,
          }}
          kind={FormFieldKind.Date}
          label={text.purchasedOn}
          required
        />
        <FormField
          hint={text.noteHint}
          inputProps={{
            maxLength: HoursLimits.NoteMaxLength,
            name: "hour-purchase-note",
            onChange: (event) => setNote(event.target.value),
            placeholder: text.notePlaceholder,
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
