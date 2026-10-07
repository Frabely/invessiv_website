import "server-only";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import type { CreateCredentialRequestDto } from "@invessiv/common/contracts/credentials/create-credential-request.dto";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";
import { credentialEventService } from "@/server/shared/services/credential/credential-event-service";
import { credentialAccessService } from "../services/credentials/credential-access-service";
import { credentialMappingService } from "../services/credentials/credential-mapping-service";
import { credentialSchemas } from "../services/credentials/credential-schemas";

export async function createCredential(
  customerId: string,
  input: CreateCredentialRequestDto,
  actor: WorkspaceActor,
): Promise<CredentialResult<CredentialDto>> {
  if (!credentialSchemas.id.safeParse(customerId).success)
    return { ok: false, code: E.NotFound };
  const parsed = credentialSchemas.create.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const data = parsed.data;
  if (!credentialCryptoService.isConfigured())
    return { ok: false, code: E.NotConfigured };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    if (
      !(await credentialAccessService.targetExists(
        tx,
        customerId,
        data.projectId,
        actor,
        Permission.CredentialsWrite,
      ))
    )
      return { ok: false, code: E.NotFound };
    // The id is part of the cipher context, so it exists before anything is encrypted.
    const id = crypto.randomUUID();
    const now = new Date();
    const encrypt = (plaintext: string, field: CredentialSecretField) =>
      credentialCryptoService.encrypt(plaintext, {
        customerId,
        credentialId: id,
        field,
      });
    const [row] = await tx
      .insert(customerCredentials)
      .values({
        id,
        customer_id: customerId,
        project_id: data.projectId,
        title: data.title,
        credential_type: data.credentialType,
        url: data.url,
        username: data.username,
        secret_ciphertext: encrypt(data.secret, CredentialSecretField.Secret),
        note_ciphertext:
          data.note === null
            ? null
            : encrypt(data.note, CredentialSecretField.Note),
        // Release to the portal is a separate, audited step (Task 71).
        visible_to_customer: false,
        created_by_side: CredentialSide.Internal,
        created_by_member_id: actor.workspaceMemberId,
        secret_changed_at: now,
        version: 1,
      })
      .returning();
    await credentialEventService.record(tx, {
      type: SecurityEventType.CredentialCreated,
      actor: { type: ActorType.User, userId: actor.userId },
      credential: row,
      occurredAt: now,
    });
    return { ok: true, value: credentialMappingService.fromRow(row, actor) };
  });
}
