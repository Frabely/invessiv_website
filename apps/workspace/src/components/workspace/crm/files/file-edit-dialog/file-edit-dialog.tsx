"use client";

import { type SubmitEvent, useId, useState } from "react";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadSide } from "@invessiv/common/constants/files/upload-side";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import {
  ButtonControl,
  Dialog,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { FileClientErrorCode } from "@/common/contracts/files/file-client-error-code";
import { fileEditRequest } from "@/common/patterns/crm/files/file-edit-request";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileTargetSelect } from "../file-target-select/file-target-select";
import { FileVisibilityField } from "../file-visibility-field/file-visibility-field";
import styles from "./file-edit-dialog.module.css";

type FileEditDialogProps = {
  content: CrmFilesDictionary;
  file: FileDto;
  projects: readonly FilesProjectOption[];
  /** Writable targets the entry may move to; the current scope is always among them. */
  targets: readonly (string | null)[];
  onCloseAction: () => void;
  onSavedAction: (file: FileDto) => void;
};

/** Edits note, visibility and project of one entry; a version conflict keeps the input. */
export function FileEditDialog({
  content,
  file,
  projects,
  targets,
  onCloseAction,
  onSavedAction,
}: FileEditDialogProps) {
  const formId = useId();
  const [values, setValues] = useState(() => fileEditRequest.valuesOf(file));
  const mutation = useVersionedMutation<FileDto, FileClientErrorCode>(
    file,
    onCloseAction,
  );

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) return;
    const request = fileEditRequest.toRequest(values, mutation.current);
    if (!request) {
      mutation.close();
      return;
    }
    await mutation.submit(async () => {
      const result = await filesApiService.updateFile(
        mutation.current.id,
        request,
      );
      if (!result.ok) return result;
      onSavedAction(result.file);
      return { ok: true, current: result.file };
    });
  }

  return (
    <Dialog
      busy={mutation.isSubmitting}
      closeLabel={content.upload.close}
      description={file.displayName}
      footer={
        <>
          <ButtonControl
            disabled={mutation.isSubmitting}
            onClick={mutation.close}
            type="button"
            variant="ghost"
          >
            {content.upload.cancel}
          </ButtonControl>
          <PrimaryCtaButton
            disabled={mutation.isSubmitting}
            form={formId}
            type="submit"
          >
            {mutation.isSubmitting
              ? content.edit.submitting
              : content.edit.submit}
          </PrimaryCtaButton>
        </>
      }
      onCloseAction={mutation.close}
      size={DialogSize.Narrow}
      title={
        file.source === FileSource.Link
          ? content.edit.titleLink
          : content.edit.titleFile
      }
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <FileTargetSelect
          content={content}
          onChangeAction={(projectId) =>
            setValues((current) => ({ ...current, projectId }))
          }
          projects={projects}
          targets={targets}
          value={values.projectId}
        />
        <FileVisibilityField
          checked={values.visibleToCustomer}
          content={content}
          locked={file.uploadedBySide === UploadSide.Customer}
          onChangeAction={(visibleToCustomer) =>
            setValues((current) => ({ ...current, visibleToCustomer }))
          }
        />
        <FormField
          inputProps={{
            maxLength: 200,
            onChange: (event) =>
              setValues((current) => ({
                ...current,
                note: event.target.value,
              })),
            placeholder: content.upload.notePlaceholder,
            value: values.note,
          }}
          kind={FormFieldKind.Text}
          label={content.upload.note}
        />
        {mutation.hasConflict ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            {content.edit.conflict}
          </p>
        ) : null}
        {mutation.errorCode ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Error}
            role="alert"
          >
            {content.errors[mutation.errorCode]}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
