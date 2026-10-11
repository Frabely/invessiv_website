"use client";

import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ConfirmDialog } from "@invessiv/ui";
import { hoursApiService } from "@/client/crm/hours-api-service";
import type { Locale } from "@/config/i18n";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import styles from "./time-entry-delete-dialog.module.css";

export type TimeEntryDeleteDialogProps = {
  content: CrmHoursDictionary;
  entry: TimeEntryDto;
  locale: Locale;
  onCloseAction: () => void;
  /** Called after the entry is gone, before the dialog closes, so lists can reload. */
  onDeletedAction: () => void;
};

/**
 * Asks before a time entry disappears. A delete carries the version like any other write: if the
 * entry changed in the meantime, the dialog shows what it says now and asks again.
 */
export function TimeEntryDeleteDialog({
  content,
  entry,
  locale,
  onCloseAction,
  onDeletedAction,
}: TimeEntryDeleteDialogProps) {
  const mutation = useVersionedMutation<TimeEntryDto, HoursErrorCode>(
    entry,
    onCloseAction,
  );
  const text = content.deleteDialog;

  function confirm() {
    void mutation.submit(async (current) => {
      const result = await hoursApiService.deleteTimeEntry(current.id, {
        version: current.version,
      });
      if (!result.ok) return result;
      onDeletedAction();
      return { ok: true };
    });
  }

  return (
    <ConfirmDialog
      busy={mutation.isSubmitting}
      cancelLabel={text.cancel}
      closeLabel={text.close}
      confirmLabel={text.confirm}
      description={formatMessage(text.description, {
        duration: formatDuration(mutation.current.durationMinutes),
        date: formatCalendarDay(mutation.current.performedOn, locale),
      })}
      onCancelAction={mutation.close}
      onConfirmAction={confirm}
      title={text.title}
      tone="danger"
    >
      {mutation.hasConflict ? (
        <p className={styles.message} role="alert">
          {text.conflict}
        </p>
      ) : null}
      {mutation.errorCode ? (
        <p className={styles.message} role="alert">
          {content.errors[mutation.errorCode]}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
