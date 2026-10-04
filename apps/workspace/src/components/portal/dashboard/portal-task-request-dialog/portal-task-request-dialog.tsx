"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { TaskFieldLimits } from "@invessiv/common/constants/crm/forms/task-field-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormDialog, FormField } from "@invessiv/ui";
import { portalTasksApiService } from "@/client/portal/portal-tasks-api-service";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-task-request-dialog.module.css";

export type PortalTaskRequestDialogProps = {
  content: PortalDashboardDictionary["tasks"]["request"];
  customerId: string;
  onCloseAction: () => void;
  /** Called with the new task's title once the server has accepted it. */
  onCreatedAction: (title: string) => void;
  projectId: string;
  /** Null without the project read grant; the dialog then names no project. */
  projectTitle: string | null;
  /** Business day (`YYYY-MM-DD`) decided once on the server; the earliest preferred date. */
  today: string;
};

/** Lets a contact hand the team a task for the selected project. */
export function PortalTaskRequestDialog({
  content,
  customerId,
  onCloseAction,
  onCreatedAction,
  projectId,
  projectTitle,
  today,
}: PortalTaskRequestDialogProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [errors, setErrors] = useState<{ title?: string; dueOn?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const trimmedTitle = title.trim();
    const nextErrors = {
      ...(trimmedTitle ? {} : { title: content.titleRequired }),
      ...(dueOn && dueOn < today ? { dueOn: content.duePast } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.title)
        requestAnimationFrame(() => titleRef.current?.focus());
      return;
    }
    setBusy(true);
    setSubmitError(null);
    const result = await portalTasksApiService.createTask(customerId, {
      projectId,
      title: trimmedTitle,
      description: details.trim(),
      dueOn: dueOn || null,
    });
    setBusy(false);
    if (!result.ok) {
      setSubmitError(content.errors[result.code]);
      return;
    }
    onCreatedAction(trimmedTitle);
  }

  return (
    <FormDialog
      busy={busy}
      cancelLabel={content.cancel}
      closeLabel={content.close}
      description={
        projectTitle
          ? formatMessage(content.description, { project: projectTitle })
          : content.descriptionNoProject
      }
      formId={formId}
      initialFocusRef={titleRef}
      onCloseAction={onCloseAction}
      submitLabel={content.submit}
      submittingLabel={content.submitting}
      title={content.title}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <FormField
          errorMessage={errors.title}
          inputProps={{
            maxLength: TaskFieldLimits.TitleMaxLength,
            onChange: (event) => setTitle(event.target.value),
            placeholder: content.titlePlaceholder,
            value: title,
          }}
          inputRef={titleRef}
          kind={FormFieldKind.Text}
          label={content.titleLabel}
          required
        />
        <FormField
          hint={content.detailsHint}
          kind={FormFieldKind.Textarea}
          label={content.detailsLabel}
          textareaProps={{
            maxLength: TaskFieldLimits.DescriptionMaxLength,
            onChange: (event) => setDetails(event.target.value),
            rows: 4,
            value: details,
          }}
        />
        <FormField
          errorMessage={errors.dueOn}
          hint={content.dueHint}
          inputProps={{
            min: today,
            onChange: (event) => setDueOn(event.target.value),
            value: dueOn,
          }}
          kind={FormFieldKind.Date}
          label={content.dueLabel}
        />
        {submitError ? (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
}
