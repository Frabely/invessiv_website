"use client";

import {
  type ReactNode,
  type SubmitEvent,
  useId,
  useRef,
  useState,
} from "react";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { validateFileLink } from "@invessiv/common/patterns/files/validate-file-link";
import { FormField } from "../../form/form-field/form-field";
import { FormDialog } from "../../dialog/form-dialog/form-dialog";
import styles from "./file-link-dialog-frame.module.css";

export type FileLinkDialogFrameProps = {
  fields: ReactNode;
  labels: {
    title: string;
    description: string;
    name: string;
    namePlaceholder: string;
    nameRequired: string;
    url: string;
    urlPlaceholder: string;
    urlHint: string;
    urlInvalid: string;
    submit: string;
    submitting: string;
  };
  cancelLabel: string;
  closeLabel: string;
  onCloseAction: () => void;
  /** Returns a localized error message, or null after saving successfully. */
  onSubmitAction: (name: string, url: string) => Promise<string | null>;
};

/** Shared name, HTTPS URL and submit states for CRM and portal links. */
export function FileLinkDialogFrame({
  fields,
  labels,
  cancelLabel,
  closeLabel,
  onCloseAction,
  onSubmitAction,
}: FileLinkDialogFrameProps) {
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const trimmedUrl = url.trim();
    const nextErrors = {
      ...(name.trim() ? {} : { name: labels.nameRequired }),
      ...(validateFileLink(trimmedUrl) ? {} : { url: labels.urlInvalid }),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => nameRef.current?.focus());
      return;
    }
    setBusy(true);
    setSubmitError(null);
    const error = await onSubmitAction(name.trim(), trimmedUrl);
    setBusy(false);
    if (error) setSubmitError(error);
    else onCloseAction();
  }

  return (
    <FormDialog
      busy={busy}
      cancelLabel={cancelLabel}
      closeLabel={closeLabel}
      description={labels.description}
      formId={formId}
      initialFocusRef={nameRef}
      onCloseAction={onCloseAction}
      submitLabel={labels.submit}
      submittingLabel={labels.submitting}
      title={labels.title}
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
            placeholder: labels.namePlaceholder,
            value: name,
          }}
          inputRef={nameRef}
          kind={FormFieldKind.Text}
          label={labels.name}
          required
        />
        <FormField
          errorMessage={errors.url}
          hint={labels.urlHint}
          inputProps={{
            autoComplete: "url",
            inputMode: "url",
            maxLength: 2048,
            onChange: (event) => setUrl(event.target.value),
            placeholder: labels.urlPlaceholder,
            value: url,
          }}
          kind={FormFieldKind.Url}
          label={labels.url}
          required
        />
        {fields}
        {submitError ? (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
}
