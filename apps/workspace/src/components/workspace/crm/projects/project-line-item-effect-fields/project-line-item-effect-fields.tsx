"use client";

import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { hoursLineItemAmountCents } from "@invessiv/common/patterns/crm/project-line-item-value";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import type { DurationInputError } from "@/common/constants/crm/forms/duration-input-errors";
import type { LineItemAssignmentBlocker } from "@/common/constants/crm/line-item-assignment-blockers";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import { CheckboxControl } from "@invessiv/ui";
import { DurationField } from "@/components/workspace/crm/hours/duration-field/duration-field";
import type { Locale } from "@/config/i18n";
import type { CrmProjectLineItemsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatEuroCents } from "@/lib/workspace/crm/format-service-price";
import styles from "./project-line-item-effect-fields.module.css";

export type ProjectLineItemEffectFieldsProps = {
  /** Hours only: allocate them to this project or leave them free for the customer. */
  allocateHoursToProject: boolean;
  onAllocateChangeAction: (value: boolean) => void;
  /** Why this template cannot be assigned to this project; the dialog then does not submit. */
  blocker: LineItemAssignmentBlocker | null;
  content: CrmProjectLineItemsDictionary;
  kind: LineItemKind;
  locale: Locale;
  onQuantityChangeAction: (value: string) => void;
  /** Minutes read from the quantity input, null while it is no usable duration. */
  quantityMinutes: number | null;
  quantityError?: DurationInputError;
  quantityInput: string;
  /** Hourly rate read from the price input, null while it does not parse. */
  rateCents: number | null;
  /** Set while editing: the purchased time is fixed and only shown. */
  storedQuantityMinutes: number | null | undefined;
};

/**
 * What assigning a template does beyond the line item, said before it happens: purchased hours
 * ask for their quantity, a further feedback round names its effect. Standard services render
 * nothing. Every statement is text; nothing here decides or calculates a rule of its own.
 */
export function ProjectLineItemEffectFields({
  allocateHoursToProject,
  onAllocateChangeAction,
  blocker,
  content,
  kind,
  locale,
  onQuantityChangeAction,
  quantityError,
  quantityInput,
  quantityMinutes,
  rateCents,
  storedQuantityMinutes,
}: ProjectLineItemEffectFieldsProps) {
  if (kind === LineItemKind.Standard) return null;
  const editing = storedQuantityMinutes !== undefined;
  const text = content.form.effects;

  if (blocker) {
    return (
      <p
        className={styles.note}
        data-tone={DialogMessageTone.Error}
        role="alert"
      >
        {content.form.blockers[blocker]}
      </p>
    );
  }

  if (kind === LineItemKind.FeedbackRound) {
    return (
      <p className={styles.note}>
        {editing ? text.feedbackRoundFixed : text.feedbackRound}
      </p>
    );
  }

  if (editing) {
    return (
      <p className={styles.note}>
        {formatMessage(text.hoursFixed, {
          duration: formatDuration(storedQuantityMinutes ?? 0),
        })}
      </p>
    );
  }

  const quantity = content.form.quantity;
  const effect = allocateHoursToProject ? text.hours : text.hoursFree;
  const pending = allocateHoursToProject
    ? text.hoursPending
    : text.hoursFreePending;
  return (
    <div className={styles.quantity}>
      <DurationField
        decreaseHoursLabel={quantity.decreaseHours}
        decreaseLabel={quantity.decrease}
        errorMessage={
          quantityError
            ? formatMessage(quantity[quantityError], {
                duration: formatDuration(HoursLimits.MaxLedgerMinutes),
              })
            : undefined
        }
        hint={quantity.hint}
        hoursLabel={quantity.hours}
        increaseHoursLabel={quantity.increaseHours}
        increaseLabel={quantity.increase}
        label={content.form.fields.quantity}
        minutesLabel={quantity.minutes}
        name="project-line-item-quantity"
        onChangeAction={onQuantityChangeAction}
        value={quantityInput}
      />
      <label className={styles.allocate}>
        <CheckboxControl
          checked={allocateHoursToProject}
          name="project-line-item-allocate-hours"
          onChange={(event) => onAllocateChangeAction(event.target.checked)}
        />
        {content.form.fields.allocateHoursToProject}
      </label>
      <p aria-live="polite" className={styles.note}>
        {quantityMinutes !== null && rateCents !== null
          ? formatMessage(effect, {
              duration: formatDuration(quantityMinutes),
              amount: formatEuroCents(
                hoursLineItemAmountCents(rateCents, quantityMinutes),
                locale,
              ),
            })
          : pending}
      </p>
    </div>
  );
}
