import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";

/** One row of the overview: the task plus what is needed to say where it belongs. */
export type TaskListRowDto = {
  task: TaskDto;
  customerId: string;
  customerDisplayName: string;
  projectTitle: string;
};

export type TaskListResult = {
  page: number;
  perPage: number;
  rows: readonly TaskListRowDto[];
  /** All rows matching the filters, not only this page. */
  total: number;
};
