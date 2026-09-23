import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { isIsoCalendarDate } from "@invessiv/common/patterns/validation/is-iso-calendar-date";
import type { CreateTaskRequestDto } from "@invessiv/common/contracts/crm/create-task-request.dto";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import type { UpdateTaskRequestDto } from "@invessiv/common/contracts/crm/update-task-request.dto";
import { TaskFormValidationCode } from "@/common/constants/crm/forms/task-form-validation-codes";
import type {
  TaskFormErrors,
  TaskFormValues,
} from "@/common/contracts/crm/task-form-values";

export function createTaskFormValues(task: TaskDto | null): TaskFormValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    actionSide: task?.actionSide ?? TaskActionSide.Internal,
    visibleToCustomer: task?.visibleToCustomer ?? false,
    assigneeMemberId: task?.assigneeMemberId ?? null,
    dueOn: task?.dueOn ?? "",
  };
}

/**
 * A task the customer has to act on must be visible to them, so choosing the customer side also
 * switches visibility on. Going back keeps the flag: it was never the user's decision to undo.
 */
export function applyActionSide(
  values: TaskFormValues,
  actionSide: TaskActionSide,
): TaskFormValues {
  return {
    ...values,
    actionSide,
    visibleToCustomer:
      actionSide === TaskActionSide.Customer ? true : values.visibleToCustomer,
  };
}

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};
  if (!values.title.trim()) {
    errors.title = TaskFormValidationCode.TitleRequired;
  }
  if (values.dueOn !== "" && !isIsoCalendarDate(values.dueOn)) {
    errors.dueOn = TaskFormValidationCode.DueOnInvalid;
  }
  return errors;
}

export function toCreateTaskRequest(
  values: TaskFormValues,
): CreateTaskRequestDto {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    actionSide: values.actionSide,
    visibleToCustomer: values.visibleToCustomer,
    assigneeMemberId: values.assigneeMemberId,
    dueOn: values.dueOn === "" ? null : values.dueOn,
  };
}

/** The assignee is required on update, so the caller passes the one the task already has. */
export function toUpdateTaskRequest(
  values: TaskFormValues,
  current: Pick<TaskDto, "assigneeMemberId" | "version">,
): UpdateTaskRequestDto {
  return {
    ...toCreateTaskRequest(values),
    assigneeMemberId: values.assigneeMemberId ?? current.assigneeMemberId,
    version: current.version,
  };
}

/** What Enter in the quick-create field sends: an internal, invisible task for the project owner. */
export function toQuickCreateTaskRequest(title: string): CreateTaskRequestDto {
  return toCreateTaskRequest({
    ...createTaskFormValues(null),
    title,
  });
}
