"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CREDENTIAL_TYPE_VALUES } from "@invessiv/common/constants/credentials/credential-types";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  CustomSelect,
  FormDialog,
  FormField,
} from "@invessiv/ui";
import { credentialsApiService } from "@/client/crm/credentials-api-service";
import { CredentialNoteMode } from "@/common/constants/crm/credentials/credential-note-modes";
import { CredentialFormErrorKind } from "@/common/constants/crm/credentials/credential-form-error-kinds";
import { RevealedSecretStatus } from "@/common/constants/credentials/revealed-secret-status";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type { CredentialFormError } from "@/common/contracts/crm/credentials/credential-form-error";
import type { CredentialFormErrors } from "@/common/contracts/crm/credentials/credential-form-errors";
import type { CredentialFormValues } from "@/common/contracts/crm/credentials/credential-form-values";
import type { CredentialsProjectOption } from "@/common/contracts/crm/credentials/credentials-project-option";
import { credentialFormRequest } from "@/common/patterns/crm/credentials/credential-form-request";
import { useFocusFirstInvalidField } from "@/hooks/workspace/use-focus-first-invalid-field";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import { useRevealedSecret } from "@/hooks/shared/use-revealed-secret";
import type { CrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./credential-form-dialog.module.css";

type CredentialFormDialogProps = {
  content: CrmCredentialsDictionary;
  /** Present while editing; the secret and the note are never part of it. */
  credential?: CredentialDto;
  customerId: string;
  defaultTarget: string | null;
  projects: readonly CredentialsProjectOption[];
  /** Scopes the entry may live in, null for customer-wide. Only writable ones. */
  targets: readonly (string | null)[];
  onCloseAction: () => void;
  onSavedAction: (credential: CredentialDto, created: boolean) => void;
};

/**
 * Creates or edits one credential. While editing, the stored secret is never loaded: an empty
 * field keeps it. The note stays untouched unless the user decides to reveal, replace or remove it.
 */
export function CredentialFormDialog({
  content,
  credential,
  customerId,
  defaultTarget,
  projects,
  targets,
  onCloseAction,
  onSavedAction,
}: CredentialFormDialogProps) {
  const formId = useId();
  const noteGroupId = useId();
  const form = content.form;
  const [values, setValues] = useState<CredentialFormValues>(() =>
    credential
      ? credentialFormRequest.valuesOf(credential)
      : credentialFormRequest.emptyValues(defaultTarget),
  );
  const [errors, setErrors] = useState<CredentialFormErrors>({});
  const [secretShown, setSecretShown] = useState(false);
  const baselineRef = useRef(credential ?? null);
  const noteReveal = useRevealedSecret({
    autoHideSeconds: CREDENTIAL_LIMITS.autoHideSeconds,
    clipboardFailedMessage: content.secretField.clipboardFailed,
    reveal: async (intent) => {
      const entry = baselineRef.current;
      if (!entry || !entry.capabilities.canReveal)
        return {
          ok: false,
          message: content.errors[CredentialApiErrorCode.NotFound],
        };
      const result = await credentialsApiService.reveal(
        entry.id,
        CredentialSecretField.Note,
        intent,
      );
      return result.ok
        ? { ok: true, value: result.value }
        : { ok: false, message: content.errors[result.code] };
    },
  });
  const [focusNote, setFocusNote] = useState(false);
  const mutation = useVersionedMutation<
    CredentialDto | null,
    CredentialApiErrorCode
  >(credential ?? null, onCloseAction, {
    onConflictAction: (fresh) => {
      const previous = baselineRef.current;
      if (!previous || !fresh) return;
      setValues((draft) =>
        credentialFormRequest.rebaseValues(draft, previous, fresh),
      );
      baselineRef.current = fresh;
      noteReveal.discardUnedited();
    },
  });
  const { formRef, focusFirstInvalidField } = useFocusFirstInvalidField();

  const current = mutation.current;
  const hasStoredNote = current?.hasNote ?? false;
  const noteVisible = noteReveal.status === RevealedSecretStatus.Visible;
  const noteLoading = noteReveal.status === RevealedSecretStatus.Loading;
  // The current scope stays selectable even if it is not among the targets.
  const targetOptions =
    current && !targets.includes(current.projectId)
      ? [current.projectId, ...targets]
      : targets;

  function update<TKey extends keyof CredentialFormValues>(
    key: TKey,
    value: CredentialFormValues[TKey],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function errorText(
    error: CredentialFormError | undefined,
    required: string,
  ): string | undefined {
    if (!error) return undefined;
    return error.kind === CredentialFormErrorKind.Required
      ? required
      : formatMessage(form.validation.tooLong, { max: error.max });
  }

  function setNoteMode(noteMode: CredentialNoteMode, note = "") {
    noteReveal.hide();
    setValues((previous) => ({ ...previous, noteMode, note }));
    setFocusNote(noteMode === CredentialNoteMode.Edit);
  }

  /** Counts as a reveal: the note is requested like any other shown value and audited. */
  function revealNote() {
    if (!current) return;
    setFocusNote(true);
    void noteReveal.show();
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isSubmitting) return;
    const submittedValues =
      noteVisible && noteReveal.edited
        ? {
            ...values,
            noteMode: CredentialNoteMode.Edit,
            note: noteReveal.value ?? "",
          }
        : values;
    const nextErrors = credentialFormRequest.validate(submittedValues, {
      secretRequired: !current,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalidField();
      return;
    }
    if (!current) {
      await mutation.submit(async () => {
        const result = await credentialsApiService.create(
          customerId,
          credentialFormRequest.toCreateRequest(submittedValues),
        );
        if (!result.ok) return result;
        onSavedAction(result.value, true);
        return { ok: true };
      });
      return;
    }
    const request = credentialFormRequest.toUpdateRequest(
      submittedValues,
      current,
    );
    if (!request) {
      mutation.close();
      return;
    }
    await mutation.submit(async () => {
      const result = await credentialsApiService.update(current.id, request);
      if (!result.ok) return result;
      onSavedAction(result.value, false);
      return { ok: true, current: result.value };
    });
  }

  return (
    <FormDialog
      busy={mutation.isSubmitting}
      cancelLabel={form.cancel}
      closeLabel={form.close}
      description={current?.title}
      formId={formId}
      onCloseAction={mutation.close}
      submitLabel={current ? form.submitEdit : form.submitCreate}
      submittingLabel={form.submitting}
      title={current ? form.titleEdit : form.titleCreate}
    >
      <form
        autoComplete="off"
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <FormField
          errorMessage={errorText(errors.title, form.validation.titleRequired)}
          inputProps={{
            autoComplete: "off",
            onChange: (event) => update("title", event.target.value),
            placeholder: form.placeholders.title,
            value: values.title,
          }}
          kind={FormFieldKind.Text}
          label={form.fields.title}
          required
        />
        <FormField
          kind={FormFieldKind.Custom}
          label={form.fields.type}
          renderControl={({ describedBy, id, invalid }) => (
            <CustomSelect
              describedBy={describedBy}
              id={id}
              invalid={invalid}
              onChange={(next) => {
                const type = CREDENTIAL_TYPE_VALUES.find(
                  (value) => value === next,
                );
                if (type) update("credentialType", type);
              }}
              options={CREDENTIAL_TYPE_VALUES.map((type) => ({
                label: content.types[type],
                value: type,
              }))}
              value={values.credentialType}
            />
          )}
        />
        {targetOptions.length > 1 ? (
          <FormField
            kind={FormFieldKind.Custom}
            label={form.fields.project}
            renderControl={({ describedBy, id, invalid }) => (
              <CustomSelect
                describedBy={describedBy}
                id={id}
                invalid={invalid}
                onChange={(next) => update("projectId", next || null)}
                options={targetOptions.map((target) => ({
                  label:
                    target === null
                      ? form.customerWideOption
                      : (projects.find((project) => project.id === target)
                          ?.title ?? target),
                  value: target ?? "",
                }))}
                value={values.projectId ?? ""}
              />
            )}
          />
        ) : null}
        <FormField
          errorMessage={errorText(errors.url, form.validation.titleRequired)}
          inputProps={{
            autoComplete: "off",
            inputMode: "url",
            onChange: (event) => update("url", event.target.value),
            placeholder: form.placeholders.url,
            value: values.url,
          }}
          kind={FormFieldKind.Text}
          label={form.fields.url}
        />
        <FormField
          errorMessage={errorText(
            errors.username,
            form.validation.titleRequired,
          )}
          inputProps={{
            autoCapitalize: "off",
            autoComplete: "off",
            onChange: (event) => update("username", event.target.value),
            spellCheck: false,
            value: values.username,
          }}
          kind={FormFieldKind.Text}
          label={form.fields.username}
        />
        <FormField
          errorMessage={errorText(
            errors.secret,
            form.validation.secretRequired,
          )}
          hint={current ? form.hints.secretKeep : form.hints.secretEncrypted}
          inputProps={{
            autoCapitalize: "off",
            // Tells password managers this is not a login for this site: nothing to fill or save.
            autoComplete: "new-password",
            onChange: (event) => update("secret", event.target.value),
            spellCheck: false,
            value: values.secret,
          }}
          inputSuffix={
            <button
              aria-label={secretShown ? form.hideSecret : form.showSecret}
              aria-pressed={secretShown}
              className={styles.secretToggle}
              onClick={() => setSecretShown((shown) => !shown)}
              title={secretShown ? form.hideSecret : form.showSecret}
              type="button"
            >
              <FontAwesomeIcon
                aria-hidden="true"
                icon={secretShown ? faEyeSlash : faEye}
              />
            </button>
          }
          kind={secretShown ? FormFieldKind.Text : FormFieldKind.Password}
          label={form.fields.secret}
          required={!current}
        />
        {values.noteMode === CredentialNoteMode.Edit || noteVisible ? (
          <div className={styles.noteEdit}>
            <div className={styles.noteField}>
              <FormField
                autoGrow
                errorMessage={errorText(
                  errors.note,
                  form.validation.titleRequired,
                )}
                hint={form.hints.noteEncrypted}
                kind={FormFieldKind.Textarea}
                label={form.fields.note}
                textareaProps={{
                  autoFocus: focusNote,
                  // Edits derived from a revealed note share its lifetime and never enter values.
                  onChange: (event) =>
                    noteVisible
                      ? noteReveal.edit(event.target.value)
                      : setNoteMode(
                          CredentialNoteMode.Edit,
                          event.target.value,
                        ),
                  placeholder: form.placeholders.note,
                  value: noteVisible ? (noteReveal.value ?? "") : values.note,
                }}
              />
            </div>
            {noteVisible ? (
              <p className={styles.noteState}>
                {formatMessage(content.secretField.countdown, {
                  seconds: noteReveal.secondsLeft,
                })}
              </p>
            ) : null}
            {hasStoredNote ? (
              <ButtonControl
                onClick={() => setNoteMode(CredentialNoteMode.Keep)}
                type="button"
                variant="ghost"
              >
                {form.note.keep}
              </ButtonControl>
            ) : null}
          </div>
        ) : (
          <div
            aria-labelledby={noteGroupId}
            className={styles.note}
            role="group"
          >
            <p className={styles.noteLabel} id={noteGroupId}>
              {form.fields.note}
            </p>
            <p className={styles.noteState}>
              {values.noteMode === CredentialNoteMode.Remove
                ? form.note.removed
                : form.note.exists}
            </p>
            <div
              aria-label={form.note.actionsLabel}
              className={styles.noteActions}
              role="group"
            >
              {values.noteMode === CredentialNoteMode.Remove ? (
                <ButtonControl
                  onClick={() => setNoteMode(CredentialNoteMode.Keep)}
                  type="button"
                  variant="ghost"
                >
                  {form.note.keep}
                </ButtonControl>
              ) : (
                <>
                  {current?.capabilities.canReveal ? (
                    <ButtonControl
                      disabled={noteLoading}
                      onClick={revealNote}
                      type="button"
                      variant="ghost"
                    >
                      {noteLoading ? form.note.revealing : form.note.reveal}
                    </ButtonControl>
                  ) : null}
                  <ButtonControl
                    onClick={() => setNoteMode(CredentialNoteMode.Edit)}
                    type="button"
                    variant="ghost"
                  >
                    {form.note.replace}
                  </ButtonControl>
                  <ButtonControl
                    onClick={() => setNoteMode(CredentialNoteMode.Remove)}
                    type="button"
                    variant="ghost"
                  >
                    {form.note.remove}
                  </ButtonControl>
                </>
              )}
            </div>
            {noteReveal.message ? (
              <p
                className={styles.message}
                data-tone={DialogMessageTone.Error}
                role="alert"
              >
                {noteReveal.message}
              </p>
            ) : null}
          </div>
        )}
        <p aria-live="polite" className="sr-only" role="status">
          {noteVisible
            ? formatMessage(content.secretField.visibleAnnouncement, {
                name: form.fields.note,
                seconds: CREDENTIAL_LIMITS.autoHideSeconds,
              })
            : ""}
        </p>
        {mutation.hasConflict ? (
          <p
            className={styles.message}
            data-tone={DialogMessageTone.Conflict}
            role="alert"
          >
            {form.conflict}
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
    </FormDialog>
  );
}
