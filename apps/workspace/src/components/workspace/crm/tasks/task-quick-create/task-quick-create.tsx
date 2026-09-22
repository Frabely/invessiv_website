"use client";

import { type SubmitEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";

import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { FormField } from "@invessiv/ui";
import { tasksApiService } from "@/client/crm/tasks-api-service";
import { toQuickCreateTaskRequest } from "@/common/patterns/crm/task-form";
import type { CrmTasksDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import styles from "./task-quick-create.module.css";

type TaskQuickCreateProps = {
  content: CrmTasksDictionary;
  onAnnounceAction: (message: string) => void;
  projectId: string;
};

/**
 * One line, Enter, done: the task is internal, invisible and goes to the project owner. Everything
 * else is set afterwards on the task itself, so capturing a thought never needs a dialog.
 */
export function TaskQuickCreate({
  content,
  onAnnounceAction,
  projectId,
}: TaskQuickCreateProps) {
  const router = useRouter();
  const hintId = useId();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [titleRequired, setTitleRequired] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleRequired(true);
      return;
    }
    if (busy) return;

    setBusy(true);
    setFailed(false);
    setTitleRequired(false);
    const result = await tasksApiService.createTask(
      projectId,
      toQuickCreateTaskRequest(trimmed),
    );
    setBusy(false);

    if (result.ok) {
      setTitle("");
      onAnnounceAction(
        formatMessage(content.announce.created, { name: trimmed }),
      );
      router.refresh();
      return;
    }
    setFailed(true);
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <FormField
        errorMessage={
          titleRequired
            ? content.quickCreate.validation.titleRequired
            : undefined
        }
        hint={content.quickCreate.hint}
        hintId={hintId}
        inputProps={{
          "aria-describedby": hintId,
          autoComplete: "off",
          disabled: busy,
          maxLength: 200,
          name: "task-quick-create-title",
          onChange: (event) => {
            setTitle(event.target.value);
            if (titleRequired) setTitleRequired(false);
          },
          placeholder: content.quickCreate.placeholder,
          value: title,
        }}
        kind={FormFieldKind.Text}
        label={content.quickCreate.label}
      />
      {failed ? (
        <p className={styles.error} role="alert">
          {content.quickCreate.error}
        </p>
      ) : null}
    </form>
  );
}
