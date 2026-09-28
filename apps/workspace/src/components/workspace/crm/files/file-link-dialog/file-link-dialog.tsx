"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { validateFileLink } from "@invessiv/common/patterns/files/validate-file-link";
import {
  ButtonControl,
  Dialog,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import type { FileClientErrorCode } from "@/common/contracts/files/file-client-error-code";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileTargetSelect } from "../file-target-select/file-target-select";
import { FileVisibilityField } from "../file-visibility-field/file-visibility-field";
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
    <Dialog
      busy={busy}
      closeLabel={content.upload.close}
      description={content.link.description}
      footer={
        <>
          <ButtonControl
            disabled={busy}
            onClick={onCloseAction}
            type="button"
            variant="ghost"
          >
            {content.upload.cancel}
          </ButtonControl>
          <PrimaryCtaButton disabled={busy} form={formId} type="submit">
            {busy ? content.link.submitting : content.link.submit}
          </PrimaryCtaButton>
        </>
      }
      initialFocusRef={nameRef}
      onCloseAction={onCloseAction}
      size={DialogSize.Narrow}
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
        <FileTargetSelect
          content={content}
          onChangeAction={setTarget}
          projects={projects}
          targets={targets}
          value={target}
        />
        <FileVisibilityField
          checked={visible}
          content={content}
          onChangeAction={setVisible}
        />
        <FormField
          inputProps={{
            maxLength: 200,
            onChange: (event) => setNote(event.target.value),
            placeholder: content.upload.notePlaceholder,
            value: note,
          }}
          kind={FormFieldKind.Text}
          label={content.upload.note}
        />
        {errorCode ? (
          <p className={styles.error} role="alert">
            {content.errors[errorCode]}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
