import type { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import type { TaskFormValidationCode } from "@/common/constants/crm/forms/task-form-validation-codes";

export type TaskFormValues = {
  title: string;
  description: string;
  actionSide: TaskActionSide;
  visibleToCustomer: boolean;
  /** Null while nobody was chosen; a new task then falls back to the project owner. */
  assigneeMemberId: string | null;
  /** The raw `YYYY-MM-DD` value of the date input, empty for no deadline. */
  dueOn: string;
};

export type TaskFormErrors = Partial<
  Record<"title" | "dueOn", TaskFormValidationCode>
>;
