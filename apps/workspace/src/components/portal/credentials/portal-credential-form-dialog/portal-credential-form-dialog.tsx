"use client";

import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import type { CreateCredentialRequestDto } from "@invessiv/common/contracts/credentials/create-credential-request.dto";
import type { UpdateCredentialRequestDto } from "@invessiv/common/contracts/credentials/update-credential-request.dto";
import type { PortalCredentialProjectOptionDto } from "@invessiv/common/contracts/portal/portal-credential-project-option.dto";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";
import { portalCredentialsApiService } from "@/client/portal/portal-credentials-api-service";
import type { CredentialFormSaveOutcome } from "@/common/contracts/credentials/credential-form-save-outcome";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";
import { portalCredentialErrorText } from "@/common/patterns/portal/portal-credential-error-text";
import { CredentialFormDialog } from "@/components/shared/credentials/credential-form-dialog/credential-form-dialog";
import type { PortalCredentialsDictionary } from "@/i18n/dictionaries/portal";

export type PortalCredentialFormDialogProps = {
  /** Offers "reveal and edit" for a stored note; from the page's capabilities. */
  canReveal: boolean;
  content: PortalCredentialsDictionary;
  /** Present while changing an entry; the secret and the note are never part of it. */
  credential?: PortalCredentialDto;
  customerId: string;
  /** Projects a new entry may be filed under. Ignored while changing: the portal never moves an entry. */
  projects: readonly PortalCredentialProjectOptionDto[];
  onCloseAction: () => void;
  /** `title` is what was typed; the entry itself is absent for a contact who may not list. */
  onSavedAction: (title: string, created: boolean) => void;
};

/**
 * Binds the shared credential form to the portal: same field rules as in the CRM, the company
 * from the URL, no project change on an existing entry, and a line saying who can read the values.
 */
export function PortalCredentialFormDialog({
  canReveal,
  content,
  credential,
  customerId,
  projects,
  onCloseAction,
  onSavedAction,
}: PortalCredentialFormDialogProps) {
  function errorText(code: CredentialApiErrorCode): string {
    return portalCredentialErrorText(code, content.errors);
  }

  async function createCredential(
    request: CreateCredentialRequestDto,
  ): Promise<CredentialFormSaveOutcome<PortalCredentialDto>> {
    const result = await portalCredentialsApiService.create(
      customerId,
      request,
    );
    if (!result.ok) return result;

    onSavedAction(request.title, true);
    return { ok: true };
  }

  async function revealNote(
    entry: PortalCredentialDto,
    intent: CredentialRevealIntent,
  ): Promise<CredentialRevealOutcome> {
    const result = await portalCredentialsApiService.reveal(
      customerId,
      entry.id,
      CredentialSecretField.Note,
      intent,
    );
    if (!result.ok) {
      return { ok: false, message: errorText(result.code) };
    }

    return { ok: true, value: result.value };
  }

  function targetLabel(target: string | null): string {
    if (target === null) return content.form.generalOption;

    return (
      projects.find((project) => project.id === target)?.title ??
      content.form.generalOption
    );
  }

  async function updateCredential(
    entry: PortalCredentialDto,
    request: UpdateCredentialRequestDto,
  ): Promise<CredentialFormSaveOutcome<PortalCredentialDto>> {
    // The form never changes the project here; the server would reject the field.
    const changes = { ...request };
    delete changes.projectId;
    const result = await portalCredentialsApiService.update(
      customerId,
      entry.id,
      changes,
    );
    if (!result.ok) {
      if ("current" in result) {
        // Keep the editor and its drafts when read permission was revoked. Only the
        // version is needed to retry; null must never turn an edit into a creation.
        return {
          ...result,
          current: result.current ?? {
            ...entry,
            version: result.currentVersion,
          },
        };
      }
      return result;
    }

    onSavedAction(result.value?.title ?? changes.title ?? entry.title, false);
    return result.value === null
      ? { ok: true }
      : { ok: true, current: result.value };
  }

  return (
    <CredentialFormDialog<PortalCredentialDto>
      canRevealNote={canReveal}
      createAction={createCredential}
      defaultTarget={null}
      entry={credential}
      errorTextAction={errorText}
      labels={content}
      notice={content.form.notice}
      onCloseAction={onCloseAction}
      revealNoteAction={revealNote}
      targetLabelAction={targetLabel}
      targets={
        credential ? [] : [null, ...projects.map((project) => project.id)]
      }
      updateAction={updateCredential}
    />
  );
}
