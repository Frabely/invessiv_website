import type { CreateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/create-time-entry-request.dto";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";

/** The form holds a parsed duration and the goodwill tick; the API wants `billable`. */
export function toTimeEntryRequest(values: {
  performedOn: string;
  minutes: number;
  description: string;
  goodwill: boolean;
  taskId: string | null;
}): CreateTimeEntryRequestDto {
  return {
    performedOn: values.performedOn,
    durationMinutes: values.minutes,
    description: values.description.trim(),
    billable: !values.goodwill,
    taskId: values.taskId,
  };
}

/**
 * What the project would have left after saving the form. An entry being edited already counts in
 * the current figure, so its old minutes are given back first. Goodwill never counts.
 */
export function remainingAfterTimeEntry(
  project: Pick<ProjectHoursBalanceDto, "remainingMinutes">,
  form: { minutes: number; goodwill: boolean },
  editing: Pick<TimeEntryDto, "durationMinutes" | "billable"> | null,
): number {
  const before =
    project.remainingMinutes +
    (editing?.billable ? editing.durationMinutes : 0);
  return before - (form.goodwill ? 0 : form.minutes);
}
