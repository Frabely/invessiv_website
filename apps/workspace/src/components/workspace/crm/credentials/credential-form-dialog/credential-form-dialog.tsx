"use client";

import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { credentialsApiService } from "@/client/crm/credentials-api-service";
import type { CrmProjectOption } from "@/common/contracts/crm/crm-project-option";
import { CredentialFormDialog as SharedCredentialFormDialog } from "@/components/shared/credentials/credential-form-dialog/credential-form-dialog";
import type { CrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";

type CredentialFormDialogProps = {
  content: CrmCredentialsDictionary;
  /** Present while editing; the secret and the note are never part of it. */
  credential?: CredentialDto;
  customerId: string;
  defaultTarget: string | null;
  projects: readonly CrmProjectOption[];
  /** Scopes the entry may live in, null for customer-wide. Only writable ones. */
  targets: readonly (string | null)[];
  onCloseAction: () => void;
  onSavedAction: (credential: CredentialDto, created: boolean) => void;
};

/** Binds the shared credential form to the CRM endpoints, texts and project scopes. */
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
  return (
    <SharedCredentialFormDialog<CredentialDto>
      canRevealNote={credential?.capabilities.canReveal ?? false}
      createAction={async (request) => {
        const result = await credentialsApiService.create(customerId, request);
        if (!result.ok) return result;
        onSavedAction(result.value, true);
        return { ok: true };
      }}
      defaultTarget={defaultTarget}
      entry={credential}
      errorTextAction={(code) => content.errors[code]}
      labels={content}
      onCloseAction={onCloseAction}
      release={content.form.release}
      releasedAction={(entry) =>
        entry.createdBySide === CredentialSide.Customer
          ? null
          : entry.visibleToCustomer
      }
      revealNoteAction={async (entry, intent) => {
        const result = await credentialsApiService.reveal(
          entry.id,
          CredentialSecretField.Note,
          intent,
        );
        return result.ok
          ? { ok: true, value: result.value }
          : { ok: false, message: content.errors[result.code] };
      }}
      targetLabelAction={(target) =>
        target === null
          ? content.form.customerWideOption
          : (projects.find((project) => project.id === target)?.title ?? target)
      }
      targets={targets}
      updateAction={async (entry, request) => {
        const result = await credentialsApiService.update(entry.id, request);
        if (!result.ok) return result;
        onSavedAction(result.value, false);
        return { ok: true, current: result.value };
      }}
    />
  );
}
