import { CREDENTIAL_LIMITS as L } from "@invessiv/common/constants/credentials/credential-limits";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { CreateCredentialRequestDto } from "@invessiv/common/contracts/credentials/create-credential-request.dto";
import type { CredentialFormSource } from "@/common/contracts/crm/credentials/credential-form-source";
import type { UpdateCredentialRequestDto } from "@invessiv/common/contracts/credentials/update-credential-request.dto";
import { CredentialNoteMode } from "@/common/constants/crm/credentials/credential-note-modes";
import { CredentialFormErrorKind } from "@/common/constants/crm/credentials/credential-form-error-kinds";
import type { CredentialFormErrors } from "@/common/contracts/crm/credentials/credential-form-errors";
import type { CredentialFormValues } from "@/common/contracts/crm/credentials/credential-form-values";

/** Empty input means "no value" for the optional plaintext columns. */
function optional(value: string): string | null {
  return value.trim() || null;
}

function emptyValues(projectId: string | null): CredentialFormValues {
  return {
    title: "",
    credentialType: CredentialType.Other,
    projectId,
    url: "",
    username: "",
    secret: "",
    noteMode: CredentialNoteMode.Edit,
    note: "",
    visibleToCustomer: false,
  };
}

/** Secret and note are never part of the DTO, so both start empty; an existing note is kept. */
function valuesOf(credential: CredentialFormSource): CredentialFormValues {
  return {
    title: credential.title,
    credentialType: credential.credentialType,
    projectId: credential.projectId,
    url: credential.url ?? "",
    username: credential.username ?? "",
    secret: "",
    noteMode: credential.hasNote
      ? CredentialNoteMode.Keep
      : CredentialNoteMode.Edit,
    note: "",
    visibleToCustomer: false,
  };
}

/** Format and required checks only; everything else is the server's decision. */
function validate(
  values: CredentialFormValues,
  options: { secretRequired: boolean },
): CredentialFormErrors {
  const errors: CredentialFormErrors = {};
  const tooLong = (max: number) =>
    ({ kind: CredentialFormErrorKind.TooLong, max }) as const;
  const title = values.title.trim();
  if (!title) errors.title = { kind: CredentialFormErrorKind.Required };
  else if (title.length > L.titleMax) errors.title = tooLong(L.titleMax);
  if (values.url.trim().length > L.urlMax) errors.url = tooLong(L.urlMax);
  if (values.username.trim().length > L.usernameMax)
    errors.username = tooLong(L.usernameMax);
  if (options.secretRequired && !values.secret)
    errors.secret = { kind: CredentialFormErrorKind.Required };
  else if (values.secret.length > L.secretMax)
    errors.secret = tooLong(L.secretMax);
  if (
    values.noteMode === CredentialNoteMode.Edit &&
    values.note.trim().length > L.noteMax
  )
    errors.note = tooLong(L.noteMax);
  return errors;
}

function toCreateRequest(
  values: CredentialFormValues,
): CreateCredentialRequestDto {
  return {
    projectId: values.projectId,
    title: values.title.trim(),
    credentialType: values.credentialType,
    url: optional(values.url),
    username: optional(values.username),
    // Not trimmed: spaces can be part of a password.
    secret: values.secret,
    note: optional(values.note),
    // Sent only when chosen, so a form that never offers the release sends no such field.
    ...(values.visibleToCustomer ? { visibleToCustomer: true } : {}),
  };
}

/** Retains edits but adopts concurrent changes to fields the user left untouched. */
function rebaseValues(
  values: CredentialFormValues,
  previous: CredentialFormSource,
  current: CredentialFormSource,
): CredentialFormValues {
  const fresh = valuesOf(current);
  const noteUntouched =
    values.noteMode === CredentialNoteMode.Keep ||
    (!previous.hasNote &&
      values.noteMode === CredentialNoteMode.Edit &&
      optional(values.note) === null);
  return {
    ...values,
    title: values.title.trim() === previous.title ? fresh.title : values.title,
    credentialType:
      values.credentialType === previous.credentialType
        ? fresh.credentialType
        : values.credentialType,
    projectId:
      values.projectId === previous.projectId
        ? fresh.projectId
        : values.projectId,
    url: optional(values.url) === previous.url ? fresh.url : values.url,
    username:
      optional(values.username) === previous.username
        ? fresh.username
        : values.username,
    ...(noteUntouched ? { noteMode: fresh.noteMode, note: "" } : {}),
  };
}

/** Three-valued: undefined keeps the stored note, text replaces it, null removes it. */
function noteChange(
  values: CredentialFormValues,
  current: CredentialFormSource,
): string | null | undefined {
  if (values.noteMode === CredentialNoteMode.Keep) return undefined;
  if (values.noteMode === CredentialNoteMode.Remove)
    return current.hasNote ? null : undefined;
  const note = optional(values.note);
  return note === null && !current.hasNote ? undefined : note;
}

/**
 * Only what differs from the stored entry; null when there is nothing to save. `released` is the
 * entry's current portal release, or null where the form does not offer to change it.
 */
function toUpdateRequest(
  values: CredentialFormValues,
  current: CredentialFormSource,
  released: boolean | null = null,
): UpdateCredentialRequestDto | null {
  const title = values.title.trim();
  const url = optional(values.url);
  const username = optional(values.username);
  const note = noteChange(values, current);
  const changes: Omit<UpdateCredentialRequestDto, "version"> = {
    ...(values.projectId !== current.projectId
      ? { projectId: values.projectId }
      : {}),
    ...(title !== current.title ? { title } : {}),
    ...(values.credentialType !== current.credentialType
      ? { credentialType: values.credentialType }
      : {}),
    ...(url !== current.url ? { url } : {}),
    ...(username !== current.username ? { username } : {}),
    ...(values.secret ? { secret: values.secret } : {}),
    ...(note !== undefined ? { note } : {}),
    ...(released !== null && values.visibleToCustomer !== released
      ? { visibleToCustomer: values.visibleToCustomer }
      : {}),
  };
  return Object.keys(changes).length > 0
    ? { ...changes, version: current.version }
    : null;
}

export const credentialFormRequest = {
  emptyValues,
  valuesOf,
  rebaseValues,
  validate,
  toCreateRequest,
  toUpdateRequest,
};
