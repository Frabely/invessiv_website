"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";

import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { parseDuration } from "@invessiv/common/patterns/crm/hours/parse-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  CheckboxControl,
  CustomSelect,
  FormDialog,
  FormField,
} from "@invessiv/ui";
import { hoursApiService } from "@/client/crm/hours-api-service";
import type { DurationInputError } from "@/common/constants/crm/forms/duration-input-errors";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type { TimeEntryTaskOption } from "@/common/contracts/crm/hours/time-entry-task-option";
import { readDurationInput } from "@/common/patterns/crm/hours/duration-input";
import {
  remainingAfterTimeEntry,
  toTimeEntryRequest,
} from "@/common/patterns/crm/hours/time-entry-form-request";
import type { Locale } from "@/config/i18n";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { DurationField } from "../duration-field/duration-field";
import styles from "./time-entry-form-dialog.module.css";

export type TimeEntryFormDialogProps = {
  content: CrmHoursDictionary;
  /** Null books a new entry; an existing one is edited against its version. */
  entry: TimeEntryDto | null;
  /** Preselects a task when the dialog was opened from a task row. */
  initialTaskId?: string | null;
  locale: Locale;
  onCloseAction: () => void;
  /** Called after a successful write, before the dialog closes, so lists can reload. */
  onSavedAction: () => void;
  /** Current figures of the project; the dialog shows what would be left after saving. */
  project: ProjectHoursBalanceDto;
  projectTitle: string;
  /** Null without the right to read tasks: the task field is then not shown at all. */
  tasks: readonly TimeEntryTaskOption[] | null;
  /** Business day: default of the date field and its upper bound. */
  today: string;
};

/**
 * Books time on a project or edits an entry. The description is what the customer reads, so it is
 * required and marked as visible. Nothing here stops an overdraw — the dialog says by how much the
 * project would be overdrawn and saves anyway.
 */
export function TimeEntryFormDialog({
  content,
  entry,
  initialTaskId = null,
  locale,
  onCloseAction,
  onSavedAction,
  project,
  projectTitle,
  tasks,
  today,
}: TimeEntryFormDialogProps) {
  const formId = useId();
  const durationRef = useRef<HTMLDivElement>(null);
  const startTaskId = entry ? entry.taskId : initialTaskId;
  const [performedOn, setPerformedOn] = useState(entry?.performedOn ?? today);
  const [duration, setDuration] = useState(
    entry ? formatDuration(entry.durationMinutes) : "",
  );
  const [taskId, setTaskId] = useState<string | null>(startTaskId);
  const [description, setDescription] = useState(
    entry?.description ??
      tasks?.find((task) => task.id === startTaskId)?.title ??
      "",
  );
  const [goodwill, setGoodwill] = useState(entry ? !entry.billable : false);
  const [durationError, setDurationError] = useState<DurationInputError | null>(
    null,
  );
  const [dateInvalid, setDateInvalid] = useState(false);
  const [descriptionMissing, setDescriptionMissing] = useState(false);
  const mutation = useVersionedMutation<TimeEntryDto | null, HoursErrorCode>(
    entry,
    onCloseAction,
  );

  const text = content.entryDialog;
  // A cancelled task stays selectable only on the entry that already names it.
  const taskOptions = tasks
    ? [
        { label: text.noTask, value: "" },
        ...tasks
          .filter((task) => task.linkable || task.id === entry?.taskId)
          .map((task) => ({ label: task.title, value: task.id })),
      ]
    : null;

  const typedMinutes = parseDuration(duration);
  const remainingAfter = remainingAfterTimeEntry(
    project,
    { minutes: typedMinutes ?? 0, goodwill },
    // The balance prop includes this entry snapshot, not the newer conflict response.
    entry,
  );

  function selectTask(next: string) {
    const previousTitle = tasks?.find((task) => task.id === taskId)?.title;
    const nextTitle = tasks?.find((task) => task.id === next)?.title;
    setTaskId(next === "" ? null : next);
    // The task title is only a suggestion: it never overwrites text somebody typed.
    if (
      nextTitle &&
      (description.trim() === "" || description === previousTitle)
    ) {
      setDescription(nextTitle);
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) return;

    const read = readDurationInput(duration, HoursLimits.MaxEntryMinutes);
    const invalidDate = performedOn === "" || performedOn > today;
    const missingDescription = description.trim() === "";
    setDurationError(read.ok ? null : read.error);
    setDateInvalid(invalidDate);
    setDescriptionMissing(missingDescription);
    if (!read.ok || invalidDate || missingDescription) {
      if (!read.ok) durationRef.current?.focus();
      return;
    }

    const request = toTimeEntryRequest({
      performedOn,
      minutes: read.minutes,
      description,
      goodwill,
      taskId,
    });
    await mutation.submit(async (current) => {
      const result = current
        ? await hoursApiService.updateTimeEntry(current.id, {
            ...request,
            version: current.version,
          })
        : await hoursApiService.createTimeEntry(project.projectId, request);
      if (!result.ok) return result;
      onSavedAction();
      return { ok: true };
    });
  }

  return (
    <FormDialog
      busy={mutation.isSubmitting}
      cancelLabel={text.cancel}
      closeLabel={text.close}
      description={formatMessage(text.description, { project: projectTitle })}
      formId={formId}
      initialFocusRef={durationRef}
      onCloseAction={mutation.close}
      submitLabel={entry ? text.submitEdit : text.submitCreate}
      submittingLabel={text.submitting}
      title={entry ? text.titleEdit : text.titleCreate}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={styles.row}>
          <DurationField
            decreaseLabel={content.duration.decrease}
            decreaseHoursLabel={content.duration.decreaseHours}
            increaseHoursLabel={content.duration.increaseHours}
            hoursLabel={content.duration.hours}
            minutesLabel={content.duration.minutes}
            errorMessage={
              durationError
                ? formatMessage(content.duration[durationError], {
                    duration: formatDuration(HoursLimits.MaxEntryMinutes),
                  })
                : undefined
            }
            hint={content.duration.hint}
            increaseLabel={content.duration.increase}
            focusRef={durationRef}
            label={text.minutes}
            maxMinutes={HoursLimits.MaxEntryMinutes}
            name="time-entry-duration"
            onChangeAction={setDuration}
            value={duration}
          />
          <FormField
            errorMessage={dateInvalid ? text.futureDate : undefined}
            inputProps={{
              max: today,
              name: "time-entry-date",
              onChange: (event) => setPerformedOn(event.target.value),
              value: performedOn,
            }}
            kind={FormFieldKind.Date}
            label={text.performedOn}
            required
          />
        </div>
        <p
          aria-live="polite"
          className={styles.forecast}
          data-tone={!goodwill && remainingAfter < 0 ? "attention" : undefined}
        >
          {goodwill
            ? text.goodwillNote
            : remainingAfter < 0
              ? formatMessage(text.overdrawsBy, {
                  duration: formatDuration(-remainingAfter),
                })
              : formatMessage(text.remainingAfter, {
                  duration: formatDuration(remainingAfter),
                })}
        </p>
        {taskOptions ? (
          <FormField
            kind={FormFieldKind.Custom}
            label={text.task}
            renderControl={({ describedBy, id, invalid }) => (
              <CustomSelect
                describedBy={describedBy}
                id={id}
                invalid={invalid}
                onChange={selectTask}
                options={taskOptions}
                value={taskId ?? ""}
              />
            )}
          />
        ) : null}
        <FormField
          autoGrow
          errorMessage={
            descriptionMissing ? text.descriptionRequired : undefined
          }
          hint={text.descriptionHint}
          kind={FormFieldKind.Textarea}
          label={text.descriptionField}
          required
          textareaProps={{
            maxLength: HoursLimits.DescriptionMaxLength,
            name: "time-entry-description",
            onChange: (event) => setDescription(event.target.value),
            placeholder: text.descriptionPlaceholder,
            value: description,
          }}
        />
        <label className={styles.goodwill}>
          <CheckboxControl
            checked={goodwill}
            name="time-entry-goodwill"
            onChange={(event) => setGoodwill(event.target.checked)}
          />
          <span>
            <span className={styles.goodwillLabel}>{text.billable}</span>
            <span className={styles.goodwillHint}>{text.billableHint}</span>
          </span>
        </label>
        {mutation.hasConflict && mutation.current ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            {text.conflict}{" "}
            {formatMessage(text.conflictCurrent, {
              duration: formatDuration(mutation.current.durationMinutes),
              date: formatCalendarDay(mutation.current.performedOn, locale),
            })}
          </p>
        ) : null}
        {mutation.errorCode ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Error}
            role="alert"
          >
            {content.errors[mutation.errorCode]}
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
}
