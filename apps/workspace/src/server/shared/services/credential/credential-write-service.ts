import "server-only";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import { credentialCryptoService } from "./credential-crypto-service";
import type {
  CredentialEditInput,
  CredentialInsertInput,
  CredentialPatch,
  CredentialRow,
} from "./credential-row-types";

/**
 * Encrypts and inserts one entry. The id is part of the cipher context, so it exists before
 * anything is encrypted. Authorization, limits and the audit event stay with the calling handler.
 */
async function insert(
  tx: ContactDatabaseTransaction,
  input: CredentialInsertInput,
): Promise<CredentialRow> {
  const id = crypto.randomUUID();
  const encrypt = (plaintext: string, field: CredentialSecretField) =>
    credentialCryptoService.encrypt(plaintext, {
      customerId: input.customerId,
      credentialId: id,
      field,
    });
  const [row] = await tx
    .insert(customerCredentials)
    .values({
      id,
      customer_id: input.customerId,
      project_id: input.projectId,
      title: input.title,
      credential_type: input.credentialType,
      url: input.url,
      username: input.username,
      secret_ciphertext: encrypt(input.secret, CredentialSecretField.Secret),
      note_ciphertext:
        input.note === null
          ? null
          : encrypt(input.note, CredentialSecretField.Note),
      visible_to_customer: input.visibleToCustomer,
      created_by_side: input.origin.memberId
        ? CredentialSide.Internal
        : CredentialSide.Customer,
      created_by_member_id: input.origin.memberId ?? null,
      created_by_portal_membership_id: input.origin.portalMembershipId ?? null,
      secret_changed_at: input.now,
      version: 1,
    })
    .returning();
  return row;
}

/** True when the edit carries a value that has to be encrypted. */
function needsEncryption(data: CredentialEditInput): boolean {
  return data.secret !== undefined || typeof data.note === "string";
}

/**
 * Only what differs from the stored row. The secret is replaced when sent; the note has three
 * states: omitted keeps it, text replaces it, null removes it. The cipher context never contains
 * the project, so moving an entry leaves both ciphertexts valid. An empty patch means there is
 * nothing to write and nothing to audit.
 */
function buildPatch(
  row: CredentialRow,
  data: CredentialEditInput,
  now: Date,
): CredentialPatch {
  const patch: CredentialPatch = {};
  if (data.projectId !== undefined && data.projectId !== row.project_id)
    patch.project_id = data.projectId;
  if (data.title !== undefined && data.title !== row.title)
    patch.title = data.title;
  if (
    data.credentialType !== undefined &&
    data.credentialType !== row.credential_type
  )
    patch.credential_type = data.credentialType;
  if (data.url !== undefined && data.url !== row.url) patch.url = data.url;
  if (data.username !== undefined && data.username !== row.username)
    patch.username = data.username;

  const encrypt = (plaintext: string, field: CredentialSecretField) =>
    credentialCryptoService.encrypt(plaintext, {
      customerId: row.customer_id,
      credentialId: row.id,
      field,
    });
  if (data.secret !== undefined) {
    patch.secret_ciphertext = encrypt(
      data.secret,
      CredentialSecretField.Secret,
    );
    patch.secret_changed_at = now;
  }
  if (typeof data.note === "string")
    patch.note_ciphertext = encrypt(data.note, CredentialSecretField.Note);
  else if (data.note === null && row.note_ciphertext !== null)
    patch.note_ciphertext = null;
  return patch;
}

export const credentialWriteService = {
  insert,
  needsEncryption,
  buildPatch,
} as const;
