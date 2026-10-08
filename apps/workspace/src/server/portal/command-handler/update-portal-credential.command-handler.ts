import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import type { PortalCredentialUpdatedDto } from "@invessiv/common/contracts/portal/portal-credential-updated.dto";
import type { PortalCredentialResult } from "@invessiv/common/contracts/portal/results/portal-credential-result";
import type { UpdatePortalCredentialRequestDto } from "@invessiv/common/contracts/portal/update-portal-credential-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalCredentialMappingService } from "@/server/portal/services/credentials/portal-credential-mapping-service";
import { portalCredentialSchemas } from "@/server/portal/services/credentials/portal-credential-schemas";
import { portalCredentialService } from "@/server/portal/services/credentials/portal-credential-service";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";
import { credentialEventService } from "@/server/shared/services/credential/credential-event-service";
import type { CredentialRow } from "@/server/shared/services/credential/credential-row-types";
import { credentialWriteService } from "@/server/shared/services/credential/credential-write-service";
import { announceSystemMessage } from "@/server/shared/services/message/announce-system-message";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { versionConflict } from "@/server/workspace/shared/version-conflict";

/**
 * A contact changes a released entry: label, type, address, login name, secret or note. Project
 * and release are not changeable here; the schema rejects both. An entry whose release was
 * withdrawn in the meantime is gone for the portal (`not_found`).
 */
export async function updatePortalCredential(
  actor: PortalActor,
  id: string,
  input: UpdatePortalCredentialRequestDto,
): Promise<PortalCredentialResult<PortalCredentialUpdatedDto>> {
  const parsed = portalCredentialSchemas.update.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const { version, ...data } = parsed.data;
  const canRead = portalCredentialService.can(
    actor,
    Permission.PortalCredentialsRead,
  );
  // A contact who may write but not list gets a confirmation and never the entry itself.
  const view = (row: CredentialRow) =>
    canRead ? portalCredentialMappingService.fromRow(row) : null;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await portalCredentialService.lockVisible(
      tx,
      actor,
      id,
      Permission.PortalCredentialsWrite,
    );
    if (!row) return { ok: false, code: E.NotFound };
    if (row.version !== version) return versionConflict(row.version, view(row));
    if (
      credentialWriteService.needsEncryption(data) &&
      !credentialCryptoService.isConfigured()
    )
      return { ok: false, code: E.NotConfigured };

    const now = new Date();
    const patch = credentialWriteService.buildPatch(row, data, now);
    // Nothing differs: no write, no version bump, no audit entry and no chat notice.
    const changedFields = Object.keys(patch);
    if (changedFields.length === 0)
      return { ok: true, value: { updated: true, credential: view(row) } };

    const write = await updateVersioned({
      tx,
      table: customerCredentials,
      id: row.id,
      expectedVersion: version,
      patch,
      toDto: view,
    });
    if (!write.ok)
      throw new Error("Locked credential disappeared during update");
    await credentialEventService.record(tx, {
      type: SecurityEventType.CredentialUpdated,
      actor: portalActivityActor(actor),
      credential: row,
      changedFields,
      occurredAt: now,
    });
    if (patch.secret_ciphertext !== undefined)
      await announceSystemMessage(
        tx,
        actor.customerId,
        SystemMessageKey.CredentialSecretChangedByCustomer,
        {},
      );
    return { ok: true, value: { updated: true, credential: write.value } };
  });
}
