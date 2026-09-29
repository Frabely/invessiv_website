"use client";

import { type SubmitEvent, useId, useState } from "react";
import type { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { FormDialog, FormField } from "@invessiv/ui";
import { projectsApiService } from "@/client/crm/projects-api-service";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import {
  createProjectFormValues,
  toCreateProjectRequest,
  toUpdateProjectRequest,
} from "@/common/patterns/crm/project-form";
import { createDefaultProcessPlan } from "@/common/patterns/crm/project-process-plan";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ProcessStepEditor } from "@/components/workspace/crm/projects/process-step-editor/process-step-editor";
import styles from "./project-editor-dialog.module.css";

export type ProjectEditorDialogProps = {
  content: CrmCockpitDictionary["projects"];
  customerId: string;
  /** Null creates a new project. */
  project: ProjectDto | null;
  /** Preselects a current step, e.g. after clicking a step in the track. */
  nextCurrentStep?: string;
  onCloseAction: () => void;
};

export function ProjectEditorDialog({
  content,
  customerId,
  project,
  nextCurrentStep,
  onCloseAction,
}: ProjectEditorDialogProps) {
  const formId = useId();
  const currentStepId = useId();
  const currentStepHintId = useId();
  const [values, setValues] = useState(() =>
    createProjectFormValues(
      project,
      createDefaultProcessPlan((phase) => content.phases[phase]),
      nextCurrentStep,
    ),
  );
  // A conflict adopts the fresh project (new version) and keeps the typed values.
  const mutation = useVersionedMutation<ProjectDto | null, ProjectErrorCode>(
    project,
    onCloseAction,
  );

  async function saveProject(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.title.trim() || mutation.isSubmitting) return;
    await mutation.submit(async (stored) => {
      const result = stored
        ? await projectsApiService.updateProject(
            stored.id,
            toUpdateProjectRequest(values, stored),
          )
        : await projectsApiService.createProject(
            customerId,
            toCreateProjectRequest(values),
          );
      return result.ok ? { ok: true, current: result.project } : result;
    });
  }

  return (
    <FormDialog
      busy={mutation.isSubmitting}
      cancelLabel={content.cancel}
      closeLabel={content.cancel}
      description={content.formDescription}
      formId={formId}
      onCloseAction={mutation.close}
      submitLabel={content.save}
      submittingLabel={content.saving}
      title={project ? content.formTitleEdit : content.formTitleCreate}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={saveProject}
      >
        <FormField
          kind="text"
          label={content.title}
          inputProps={{
            autoFocus: true,
            onChange: (event) =>
              setValues((current) => ({
                ...current,
                title: event.target.value,
              })),
            required: true,
            value: values.title,
          }}
        />
        <label className={styles.selectLabel}>
          {content.statusLabel}
          <select
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                status: event.target.value as ProjectStatus,
              }))
            }
            value={values.status}
          >
            {Object.entries(content.status).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <ProcessStepEditor
          content={content}
          onPlanChangeAction={(plan) =>
            setValues((current) => ({ ...current, plan }))
          }
          plan={values.plan}
        />
        <div className={styles.selectLabel}>
          <label htmlFor={currentStepId}>{content.currentProcessStep}</label>
          <select
            aria-describedby={currentStepHintId}
            id={currentStepId}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                plan: {
                  ...current.plan,
                  currentProcessStep: event.target.value,
                },
              }))
            }
            value={values.plan.currentProcessStep}
          >
            {values.plan.steps.map((step, index) => (
              <option key={`${step}-${index}`} value={step}>
                {step}
              </option>
            ))}
          </select>
          <small className={styles.hint} id={currentStepHintId}>
            {content.currentProcessStepHint}
          </small>
        </div>
        {mutation.hasConflict ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            {content.saveConflict}
          </p>
        ) : null}
        {mutation.errorCode ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Error}
            role="alert"
          >
            {content.saveError}
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
}
