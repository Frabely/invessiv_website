import "server-only";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import type { UpdateCredentialRequestDto } from "@invessiv/common/contracts/credentials/update-credential-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";
import { credentialEventService } from "@/server/shared/services/credential/credential-event-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { versionConflict } from "@/server/workspace/shared/version-conflict";
import { credentialAccessService } from "../services/credentials/credential-access-service";
import { credentialMappingService } from "../services/credentials/credential-mapping-service";
import { credentialSchemas } from "../services/credentials/credential-schemas";
import type { CredentialRow } from "../services/credentials/credential-types";

type CredentialPatch = Partial<
  Pick<
    CredentialRow,
    | "project_id"
    | "title"
    | "credential_type"
    | "url"
    | "username"
    | "secret_ciphertext"
    | "note_ciphertext"
    | "secret_changed_at"
  >
>;

/** Plaintext columns that actually differ from the stored row. */
function plainPatch(
  row: CredentialRow,
  data: {
    projectId?: string | null;
    title?: string;
    credentialType?: CredentialRow["credential_type"];
    url?: string | null;
    username?: string | null;
  },
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
  return patch;
}

/**
 * The secret is only replaced when sent. The note has three states: omitted keeps it, text
 * replaces it, null removes it. The cipher context never contains the project, so moving an
 * entry between projects leaves both ciphertexts valid.
 */
export async function updateCredential(
  id: string,
  input: UpdateCredentialRequestDto,
  actor: WorkspaceActor,
): Promise<CredentialResult<CredentialDto>> {
  if (!credentialSchemas.id.safeParse(id).success)
    return { ok: false, code: E.NotFound };
  const parsed = credentialSchemas.update.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const data = parsed.data;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await credentialAccessService.lock(
      tx,
      id,
      actor,
      Permission.CredentialsWrite,
    );
    if (!row) return { ok: false, code: E.NotFound };
    if (row.version !== data.version)
      return versionConflict(
        row.version,
        credentialMappingService.fromRow(row, actor),
      );
    const patch = plainPatch(row, data);
    if (
      patch.project_id !== undefined &&
      !(await credentialAccessService.targetExists(
        tx,
        row.customer_id,
        patch.project_id,
        actor,
        Permission.CredentialsWrite,
      ))
    )
      return { ok: false, code: E.NotFound };

    const now = new Date();
    const encrypts = data.secret !== undefined || typeof data.note === "string";
    if (encrypts && !credentialCryptoService.isConfigured())
      return { ok: false, code: E.NotConfigured };
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

    // Nothing differs: no write, no version bump and no audit entry for a non-event.
    const changedFields = Object.keys(patch);
    if (changedFields.length === 0)
      return { ok: true, value: credentialMappingService.fromRow(row, actor) };

    const write = await updateVersioned({
      tx,
      table: customerCredentials,
      id,
      expectedVersion: data.version,
      patch,
      toDto: (updated) => credentialMappingService.fromRow(updated, actor),
    });
    if (!write.ok)
      throw new Error("Locked credential disappeared during update");
    await credentialEventService.record(tx, {
      type: SecurityEventType.CredentialUpdated,
      actor: { type: ActorType.User, userId: actor.userId },
      credential: { ...row, project_id: write.value.projectId },
      changedFields,
      occurredAt: now,
    });
    return { ok: true, value: write.value };
  });
}
