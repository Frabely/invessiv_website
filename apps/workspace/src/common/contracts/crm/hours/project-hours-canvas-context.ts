import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";
import type { TimeEntryTaskOption } from "./time-entry-task-option";

/** Readable hours and action capabilities of the currently selected project. */
export type ProjectHoursCanvasContext = {
  project: CustomerHoursProjectDto;
  canWrite: boolean;
  canBook: boolean;
  canManage: boolean;
  freeMinutes: number | null;
  tasks: readonly TimeEntryTaskOption[] | null;
  bookedMinutesByTaskId: Readonly<Record<string, number>>;
  today: string;
};
