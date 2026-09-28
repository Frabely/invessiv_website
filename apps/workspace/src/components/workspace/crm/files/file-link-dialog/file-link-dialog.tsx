"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { validateFileLink } from "@invessiv/common/patterns/files/validate-file-link";
import { FormField } from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import type { FileClientErrorCode } from "@/common/contracts/files/file-client-error-code";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileMetadataFields } from "../file-metadata-fields/file-metadata-fields";
import { FileFormDialog } from "../file-form-dialog/file-form-dialog";
import styles from "./file-link-dialog.module.css";

type FileLinkDialogProps = {
  content: CrmFilesDictionary;
  customerId: string;
  projects: readonly FilesProjectOption[];
  targets: readonly (string | null)[];
  defaultTarget: string | null;
  onCloseAction: () => void;
  onCreatedAction: (file: FileDto) => void;
};

/** Adds an HTTPS link; the server stores it as given and never opens it. */
export function FileLinkDialog({
  content,
  customerId,
  projects,
  targets,
  defaultTarget,
  onCloseAction,
  onCreatedAction,
}: FileLinkDialogProps) {
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [target, setTarget] = useState<string | null>(defaultTarget);
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [errorCode, setErrorCode] = useState<FileClientErrorCode | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const trimmedUrl = url.trim();
    const nextErrors = {
      ...(name.trim() ? {} : { name: content.link.nameRequired }),
      ...(validateFileLink(trimmedUrl) ? {} : { url: content.link.urlInvalid }),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => nameRef.current?.focus());
      return;
    }
    setBusy(true);
    setErrorCode(null);
    const result = await filesApiService.createLink(customerId, {
      displayName: name.trim(),
      url: trimmedUrl,
      projectId: target,
      visibleToCustomer: visible,
      note: note.trim() || null,
    });
    setBusy(false);
    if (!result.ok) {
      setErrorCode(result.code);
      return;
    }
    onCreatedAction(result.value);
    onCloseAction();
  }

  return (
    <FileFormDialog
      busy={busy}
      cancelLabel={content.upload.cancel}
      closeLabel={content.upload.close}
      description={content.link.description}
      formId={formId}
      initialFocusRef={nameRef}
      onCloseAction={onCloseAction}
      submitLabel={content.link.submit}
      submittingLabel={content.link.submitting}
      title={content.link.title}
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        <FormField
          errorMessage={errors.name}
          inputProps={{
            maxLength: 255,
            onChange: (event) => setName(event.target.value),
            placeholder: content.link.namePlaceholder,
            value: name,
          }}
          inputRef={nameRef}
          kind={FormFieldKind.Text}
          label={content.link.name}
          required
        />
        <FormField
          errorMessage={errors.url}
          hint={content.link.urlHint}
          inputProps={{
            autoComplete: "url",
            inputMode: "url",
            maxLength: 2048,
            onChange: (event) => setUrl(event.target.value),
            placeholder: content.link.urlPlaceholder,
            value: url,
          }}
          kind={FormFieldKind.Url}
          label={content.link.url}
          required
        />
        <FileMetadataFields
          content={content}
          note={note}
          onNoteChangeAction={setNote}
          onTargetChangeAction={setTarget}
          onVisibilityChangeAction={setVisible}
          projects={projects}
          targets={targets}
          target={target}
          visibleToCustomer={visible}
        />
        {errorCode ? (
          <p className={styles.error} role="alert">
            {content.errors[errorCode]}
          </p>
        ) : null}
      </form>
    </FileFormDialog>
  );
}
