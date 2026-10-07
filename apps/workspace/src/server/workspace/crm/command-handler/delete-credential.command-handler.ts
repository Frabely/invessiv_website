import "server-only";
import { eq } from "drizzle-orm";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import type { DeleteCredentialRequestDto } from "@invessiv/common/contracts/credentials/delete-credential-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialEventService } from "@/server/shared/services/credential/credential-event-service";
import { versionConflict } from "@/server/workspace/shared/version-conflict";
import { credentialAccessService } from "../services/credentials/credential-access-service";
import { credentialMappingService } from "../services/credentials/credential-mapping-service";
import { credentialSchemas } from "../services/credentials/credential-schemas";

/** A real delete; the security event is what remains. Works without a keyring. */
export async function deleteCredential(
  id: string,
  input: DeleteCredentialRequestDto,
  actor: WorkspaceActor,
): Promise<CredentialResult<{ deleted: true }>> {
  if (!credentialSchemas.id.safeParse(id).success)
    return { ok: false, code: E.NotFound };
  const parsed = credentialSchemas.delete.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await credentialAccessService.lock(
      tx,
      id,
      actor,
      Permission.CredentialsWrite,
    );
    if (!row) return { ok: false, code: E.NotFound };
    if (row.version !== parsed.data.version)
      return versionConflict(
        row.version,
        credentialMappingService.fromRow(row, actor),
      );
    await credentialEventService.record(tx, {
      type: SecurityEventType.CredentialDeleted,
      actor: { type: ActorType.User, userId: actor.userId },
      credential: row,
      occurredAt: new Date(),
    });
    await tx.delete(customerCredentials).where(eq(customerCredentials.id, id));
    return { ok: true, value: { deleted: true } };
  });
}
