"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CREDENTIAL_TYPE_VALUES } from "@invessiv/common/constants/credentials/credential-types";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { CreateCredentialRequestDto } from "@invessiv/common/contracts/credentials/create-credential-request.dto";
import type { UpdateCredentialRequestDto } from "@invessiv/common/contracts/credentials/update-credential-request.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  CheckboxControl,
  CustomSelect,
  FormDialog,
  FormField,
} from "@invessiv/ui";
import { CredentialNoteMode } from "@/common/constants/crm/credentials/credential-note-modes";
import { CredentialFormErrorKind } from "@/common/constants/crm/credentials/credential-form-error-kinds";
import { RevealedSecretStatus } from "@/common/constants/credentials/revealed-secret-status";
import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import type { CredentialFormDialogLabels } from "@/common/contracts/credentials/credential-form-dialog-labels";
import type { CredentialFormReleaseLabels } from "@/common/contracts/credentials/credential-form-release-labels";
import type { CredentialFormSaveOutcome } from "@/common/contracts/credentials/credential-form-save-outcome";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import type { CredentialFormError } from "@/common/contracts/crm/credentials/credential-form-error";
import type { CredentialFormErrors } from "@/common/contracts/crm/credentials/credential-form-errors";
import type { CredentialFormSource } from "@/common/contracts/crm/credentials/credential-form-source";
import type { CredentialFormValues } from "@/common/contracts/crm/credentials/credential-form-values";
import { credentialFormRequest } from "@/common/patterns/crm/credentials/credential-form-request";
import { useRevealedSecret } from "@/hooks/shared/use-revealed-secret";
import { useFocusFirstInvalidField } from "@/hooks/workspace/use-focus-first-invalid-field";
import { useVersionedMutation } from "@/hooks/workspace/use-versioned-mutation";
import styles from "./credential-form-dialog.module.css";

export type CredentialFormDialogProps<TEntry extends CredentialFormSource> = {
  /** Present while editing; the secret and the note are never part of it. */
  entry?: TEntry;
  /** Offers "reveal and edit" for a stored note. Without it the note can only be replaced or removed. */
  canRevealNote: boolean;
  defaultTarget: string | null;
  labels: CredentialFormDialogLabels;
  /** Optional line above the fields, e.g. who can read what is entered here. */
  notice?: string;
  /** Offers to release the entry to the portal, on a new entry and while editing. */
  release?: CredentialFormReleaseLabels;
  /**
   * The stored portal release of an entry, or null when it cannot be changed (the customer's own
   * entry always stays visible to them). Required to offer the choice while editing.
   */
  releasedAction?: (entry: TEntry) => boolean | null;
  /** Scopes the entry may be filed under, null for "no project". Fewer than two hide the choice. */
  targets: readonly (string | null)[];
  targetLabelAction: (projectId: string | null) => string;
  errorTextAction: (code: CredentialApiErrorCode) => string;
  createAction: (
    request: CreateCredentialRequestDto,
  ) => Promise<CredentialFormSaveOutcome<TEntry>>;
  updateAction: (
    entry: TEntry,
    request: UpdateCredentialRequestDto,
  ) => Promise<CredentialFormSaveOutcome<TEntry>>;
  /** Requests the stored note in plaintext; counts as a reveal and is audited by the server. */
  revealNoteAction: (
    entry: TEntry,
    intent: CredentialRevealIntent,
  ) => Promise<CredentialRevealOutcome>;
  onCloseAction: () => void;
};

/**
 * Creates or edits one credential. It knows no endpoint and no dictionary; the CRM and the portal
 * pass texts and the save functions. While editing, the stored secret is never loaded: an empty
 * field keeps it. The note stays untouched unless the user decides to reveal, replace or remove it.
 */
export function CredentialFormDialog<TEntry extends CredentialFormSource>({
  entry,
  canRevealNote,
  defaultTarget,
  labels,
  notice,
  release,
  releasedAction,
  targets,
  targetLabelAction,
  errorTextAction,
  createAction,
  updateAction,
  revealNoteAction,
  onCloseAction,
}: CredentialFormDialogProps<TEntry>) {
  const formId = useId();
  const noteGroupId = useId();
  const releaseHintId = useId();
  const form = labels.form;
  const released = (source: TEntry | null) =>
    source && releasedAction ? releasedAction(source) : null;
  const [values, setValues] = useState<CredentialFormValues>(() =>
    entry
      ? {
          ...credentialFormRequest.valuesOf(entry),
          visibleToCustomer: released(entry) ?? false,
        }
      : credentialFormRequest.emptyValues(defaultTarget),
  );
  const [errors, setErrors] = useState<CredentialFormErrors>({});
  const [secretShown, setSecretShown] = useState(false);
  const baselineRef = useRef<TEntry | null>(entry ?? null);
  const noteReveal = useRevealedSecret({
    autoHideSeconds: CREDENTIAL_LIMITS.autoHideSeconds,
    clipboardFailedMessage: labels.secretField.clipboardFailed,
    reveal: async (intent) => {
      const baseline = baselineRef.current;
      if (!baseline || !canRevealNote)
        return {
          ok: false,
          message: errorTextAction(CredentialApiErrorCode.NotFound),
        };
      return revealNoteAction(baseline, intent);
    },
  });
  const [focusNote, setFocusNote] = useState(false);
  const mutation = useVersionedMutation<TEntry | null, CredentialApiErrorCode>(
    entry ?? null,
    onCloseAction,
    {
      onConflictAction: (fresh) => {
        const previous = baselineRef.current;
        if (!previous || !fresh) return;
        const freshRelease = released(fresh);
        setValues((draft) => ({
          ...credentialFormRequest.rebaseValues(draft, previous, fresh),
          // An untouched tick follows what someone else decided in the meantime.
          ...(freshRelease !== null &&
          draft.visibleToCustomer === released(previous)
            ? { visibleToCustomer: freshRelease }
            : {}),
        }));
        baselineRef.current = fresh;
        noteReveal.discardUnedited();
      },
    },
  );
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
      await mutation.submit(() =>
        createAction(credentialFormRequest.toCreateRequest(submittedValues)),
      );
      return;
    }
    const request = credentialFormRequest.toUpdateRequest(
      submittedValues,
      current,
      released(current),
    );
    if (!request) {
      mutation.close();
      return;
    }
    await mutation.submit(() => updateAction(current, request));
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
        {notice ? <p className={styles.notice}>{notice}</p> : null}
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
                label: labels.types[type],
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
                  label: targetLabelAction(target),
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
                {formatMessage(labels.secretField.countdown, {
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
                  {canRevealNote ? (
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
        {release && (!current || released(current) !== null) ? (
          <div className={styles.release}>
            <label className={styles.releaseLabel}>
              <CheckboxControl
                aria-describedby={releaseHintId}
                checked={values.visibleToCustomer}
                onChange={(event) =>
                  update("visibleToCustomer", event.target.checked)
                }
              />
              <span>{release.label}</span>
            </label>
            <p className={styles.releaseHint} id={releaseHintId}>
              {release.hint}
            </p>
          </div>
        ) : null}
        <p aria-live="polite" className="sr-only" role="status">
          {noteVisible
            ? formatMessage(labels.secretField.visibleAnnouncement, {
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
            {errorTextAction(mutation.errorCode)}
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
}
