"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";

import type { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { TaskFieldLimits } from "@invessiv/common/constants/crm/forms/task-field-limits";
import {
  TASK_ACTION_SIDE_VALUES,
  TaskActionSide,
} from "@invessiv/common/constants/crm/task-action-sides";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import {
  ButtonControl,
  CheckboxControl,
  CustomSelect,
  Dialog,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { tasksApiService } from "@/client/crm/tasks-api-service";
import type { TaskFormValidationCode } from "@/common/constants/crm/forms/task-form-validation-codes";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type {
  TaskFormErrors,
  TaskFormValues,
} from "@/common/contracts/crm/task-form-values";
import type { TaskAssigneeOption } from "@/common/contracts/crm/tasks-view-model";
import {
  applyActionSide,
  createTaskFormValues,
  toCreateTaskRequest,
  toUpdateTaskRequest,
  validateTaskForm,
} from "@/common/patterns/crm/task-form";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./task-form-dialog.module.css";

type TaskFormDialogProps = {
  content: CrmTasksDictionary;
  /** Empty when the actor may not list members; the assignee field is then left out. */
  members: readonly TaskAssigneeOption[];
  onCloseAction: () => void;
  projectId: string;
  /** Null adds a new task; an existing one edits it. */
  task: TaskDto | null;
};

const TaskFormField = {
  Title: "title",
  Description: "description",
  DueOn: "dueOn",
  AssigneeMemberId: "assigneeMemberId",
  VisibleToCustomer: "visibleToCustomer",
} as const satisfies Record<string, keyof TaskFormValues>;

function fieldError(
  code: TaskFormValidationCode | undefined,
  content: CrmTasksDictionary,
): string | undefined {
  return code ? content.form.validation[code] : undefined;
}

export function TaskFormDialog({
  content,
  members,
  onCloseAction,
  projectId,
  task,
}: TaskFormDialogProps) {
  const formId = useId();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<TaskFormValues>(() =>
    createTaskFormValues(task),
  );
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const mutation = useVersionedMutation<TaskDto | null, TaskErrorCode>(
    task,
    onCloseAction,
  );

  const customerActs = values.actionSide === TaskActionSide.Customer;
  const assigneeOptions = [
    ...members
      .filter(
        (member) =>
          member.active || member.id === task?.[TaskFormField.AssigneeMemberId],
      )
      .map((member) => ({
        label: member.active
          ? member.displayName
          : formatMessage(content.form.assigneeInactive, {
              name: member.displayName,
            }),
        value: member.id,
      })),
  ];

  function update<K extends keyof TaskFormValues>(
    key: K,
    value: TaskFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) return;

    const validation = validateTaskForm(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      requestAnimationFrame(() => titleInputRef.current?.focus());
      return;
    }

    await mutation.submit((current) =>
      current
        ? tasksApiService.updateTask(
            current.id,
            toUpdateTaskRequest(values, current),
          )
        : tasksApiService.createTask(projectId, toCreateTaskRequest(values)),
    );
  }

  return (
    <Dialog
      busy={mutation.isSubmitting}
      closeLabel={content.form.buttons.close}
      description={
        task
          ? formatMessage(content.form.description.edit, { name: task.title })
          : content.form.description.create
      }
      footer={
        <>
          <p className={styles.footerRequiredHint}>
            {content.form.requiredHint}
          </p>
          <div className={styles.footerActions}>
            <ButtonControl
              disabled={mutation.isSubmitting}
              onClick={mutation.close}
              type="button"
              variant="ghost"
            >
              {content.form.buttons.cancel}
            </ButtonControl>
            <PrimaryCtaButton
              disabled={mutation.isSubmitting}
              form={formId}
              type="submit"
            >
              {mutation.isSubmitting
                ? content.form.buttons.submitting
                : task
                  ? content.form.buttons.submitEdit
                  : content.form.buttons.submitCreate}
            </PrimaryCtaButton>
          </div>
        </>
      }
      initialFocusRef={titleInputRef}
      onCloseAction={mutation.close}
      size={DialogSize.Narrow}
      title={task ? content.form.title.edit : content.form.title.create}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={styles.grid}>
          <FormField
            className={styles.fullWidth}
            errorMessage={fieldError(errors.title, content)}
            inputProps={{
              maxLength: TaskFieldLimits.TitleMaxLength,
              name: "task-title",
              onChange: (event) =>
                update(TaskFormField.Title, event.target.value),
              placeholder: content.form.placeholders.title,
              value: values.title,
            }}
            inputRef={titleInputRef}
            kind={FormFieldKind.Text}
            label={content.form.fields.title}
            required
          />
          <FormField
            className={styles.fullWidth}
            kind={FormFieldKind.Textarea}
            label={content.form.fields.description}
            textareaProps={{
              maxLength: TaskFieldLimits.DescriptionMaxLength,
              name: "task-description",
              onChange: (event) =>
                update(TaskFormField.Description, event.target.value),
              placeholder: content.form.placeholders.description,
              rows: 3,
              value: values.description,
            }}
          />
          <FormField
            kind={FormFieldKind.Custom}
            label={content.form.fields.actionSide}
            renderControl={({ describedBy, id, invalid }) => (
              <CustomSelect
                describedBy={describedBy}
                id={id}
                invalid={invalid}
                onChange={(next) =>
                  setValues((current) =>
                    applyActionSide(current, next as TaskActionSide),
                  )
                }
                options={TASK_ACTION_SIDE_VALUES.map((side) => ({
                  label: content.actionSide[side],
                  value: side,
                }))}
                value={values.actionSide}
              />
            )}
          />
          <FormField
            errorMessage={fieldError(errors.dueOn, content)}
            inputProps={{
              name: "task-due-on",
              onChange: (event) =>
                update(TaskFormField.DueOn, event.target.value),
              type: "date",
              value: values.dueOn,
            }}
            kind={FormFieldKind.Text}
            label={content.form.fields.dueOn}
          />
          {members.length > 0 ? (
            <FormField
              className={styles.fullWidth}
              hint={
                task === null ? content.form.hints.assigneeDefault : undefined
              }
              kind={FormFieldKind.Custom}
              label={content.form.fields[TaskFormField.AssigneeMemberId]}
              renderControl={({ describedBy, id, invalid }) => (
                <CustomSelect
                  describedBy={describedBy}
                  id={id}
                  invalid={invalid}
                  onChange={(next) =>
                    update(
                      TaskFormField.AssigneeMemberId,
                      next === "" ? null : next,
                    )
                  }
                  options={
                    values[TaskFormField.AssigneeMemberId] === null
                      ? [
                          {
                            label:
                              content.form.placeholders[
                                TaskFormField.AssigneeMemberId
                              ],
                            value: "",
                          },
                          ...assigneeOptions,
                        ]
                      : assigneeOptions
                  }
                  value={values[TaskFormField.AssigneeMemberId] ?? ""}
                />
              )}
            />
          ) : null}
          <div className={`${styles.fullWidth} ${styles.visibility}`}>
            <label className={styles.checkboxLabel}>
              <CheckboxControl
                checked={values.visibleToCustomer}
                disabled={customerActs}
                onChange={(event) =>
                  update(TaskFormField.VisibleToCustomer, event.target.checked)
                }
              />
              <span>{content.form.fields.visibleToCustomer}</span>
            </label>
            {customerActs ? (
              <p className={styles.hint}>{content.form.hints.visibleForced}</p>
            ) : null}
          </div>
        </div>

        {mutation.hasConflict && mutation.current ? (
          <section
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            <p className={styles.messageText}>
              {content.form.conflict.message}
            </p>
            <p className={styles.messageDetail}>
              {formatMessage(content.form.conflict.currentTitle, {
                name: mutation.current.title,
              })}
            </p>
          </section>
        ) : null}
        {mutation.errorCode ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Error}
            role="alert"
          >
            {content.form.errors[mutation.errorCode]}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
