import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import type { CredentialMetadataRow, CredentialRow } from "./credential-types";

function toDto(
  row: CredentialMetadataRow,
  actor: WorkspaceActor,
): CredentialDto {
  const target = {
    customerId: row.customer_id,
    projectId: row.project_id ?? undefined,
  };
  return {
    id: row.id,
    customerId: row.customer_id,
    projectId: row.project_id,
    title: row.title,
    credentialType: row.credential_type,
    url: row.url,
    username: row.username,
    hasNote: row.has_note,
    visibleToCustomer: row.visible_to_customer,
    createdBySide: row.created_by_side,
    secretChangedAt: row.secret_changed_at.toISOString(),
    lastRevealedAt: row.last_revealed_at?.toISOString() ?? null,
    updatedAt: row.updated_at.toISOString(),
    version: row.version,
    capabilities: {
      canWrite: canOn(actor, Permission.CredentialsWrite, target),
      canReveal: canOn(actor, Permission.CredentialsReveal, target),
    },
  };
}

/**
 * For write paths that hold the full row. `toDto` copies named fields only, so the ciphertexts on
 * the row cannot travel into the DTO.
 */
function fromRow(row: CredentialRow, actor: WorkspaceActor): CredentialDto {
  return toDto({ ...row, has_note: row.note_ciphertext !== null }, actor);
}

export const credentialMappingService = { toDto, fromRow };
