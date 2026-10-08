import "server-only";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import type { UpdateCredentialRequestDto } from "@invessiv/common/contracts/credentials/update-credential-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";
import { credentialEventService } from "@/server/shared/services/credential/credential-event-service";
import { credentialWriteService } from "@/server/shared/services/credential/credential-write-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { versionConflict } from "@/server/workspace/shared/version-conflict";
import { credentialAccessService } from "../services/credentials/credential-access-service";
import { credentialMappingService } from "../services/credentials/credential-mapping-service";
import { credentialSchemas } from "../services/credentials/credential-schemas";

/**
 * What changes in the entry itself is decided by `credentialWriteService.buildPatch`, shared with
 * the portal. An edit may also release the entry or take the release back; that follows the same
 * rules as the release command and is audited as its own event next to the edit.
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
  const { visibleToCustomer, ...data } = parsed.data;
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
    if (
      data.projectId !== undefined &&
      data.projectId !== row.project_id &&
      !(await credentialAccessService.targetExists(
        tx,
        row.customer_id,
        data.projectId,
        actor,
        Permission.CredentialsWrite,
      ))
    )
      return { ok: false, code: E.NotFound };

    // Null when the request leaves the release alone or asks for what already holds.
    const release =
      visibleToCustomer !== undefined &&
      visibleToCustomer !== row.visible_to_customer
        ? visibleToCustomer
        : null;
    // Judged against the project the entry will have after this edit.
    const projectId =
      data.projectId !== undefined ? data.projectId : row.project_id;
    const visibilityError = await credentialAccessService.portalVisibilityError(
      tx,
      { ...row, project_id: projectId },
      visibleToCustomer,
    );
    if (visibilityError) return { ok: false, code: visibilityError };

    if (
      credentialWriteService.needsEncryption(data) &&
      !credentialCryptoService.isConfigured()
    )
      return { ok: false, code: E.NotConfigured };

    const now = new Date();
    const patch = credentialWriteService.buildPatch(row, data, now);
    // Nothing differs: no write, no version bump and no audit entry for a non-event.
    const changedFields = Object.keys(patch);
    if (changedFields.length === 0 && release === null)
      return { ok: true, value: credentialMappingService.fromRow(row, actor) };

    const write = await updateVersioned({
      tx,
      table: customerCredentials,
      id,
      expectedVersion: data.version,
      patch:
        release === null ? patch : { ...patch, visible_to_customer: release },
      toDto: (updated) => credentialMappingService.fromRow(updated, actor),
    });
    if (!write.ok)
      throw new Error("Locked credential disappeared during update");
    const eventActor = { type: ActorType.User, userId: actor.userId } as const;
    const credential = { ...row, project_id: write.value.projectId };
    if (changedFields.length > 0)
      await credentialEventService.record(tx, {
        type: SecurityEventType.CredentialUpdated,
        actor: eventActor,
        credential,
        changedFields,
        occurredAt: now,
      });
    if (release !== null)
      await credentialEventService.record(tx, {
        type: SecurityEventType.CredentialPortalVisibilityChanged,
        actor: eventActor,
        credential,
        visible: release,
        occurredAt: now,
      });
    return { ok: true, value: write.value };
  });
}
