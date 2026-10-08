import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";
import type { CredentialRow } from "@/server/shared/services/credential/credential-row-types";
import type { PortalCredentialMetadataRow } from "./portal-credential-types";

function toDto(row: PortalCredentialMetadataRow): PortalCredentialDto {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    credentialType: row.credential_type,
    url: row.url,
    username: row.username,
    hasNote: row.has_note,
    createdByCustomer: row.created_by_side === CredentialSide.Customer,
    secretChangedAt: row.secret_changed_at.toISOString(),
    version: row.version,
  };
}

/**
 * For write paths that hold the full row. `toDto` copies named fields only, so ciphertexts,
 * release state and creator ids on the row cannot travel into the DTO.
 */
function fromRow(row: CredentialRow): PortalCredentialDto {
  return toDto({ ...row, has_note: row.note_ciphertext !== null });
}

export const portalCredentialMappingService = { toDto, fromRow };
