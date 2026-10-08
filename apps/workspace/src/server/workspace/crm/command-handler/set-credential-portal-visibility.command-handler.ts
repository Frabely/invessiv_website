import "server-only";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import type { SetCredentialPortalVisibilityRequestDto } from "@invessiv/common/contracts/credentials/set-credential-portal-visibility-request.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerCredentials } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialEventService } from "@/server/shared/services/credential/credential-event-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { versionConflict } from "@/server/workspace/shared/version-conflict";
import { credentialAccessService } from "../services/credentials/credential-access-service";
import { credentialMappingService } from "../services/credentials/credential-mapping-service";
import { credentialSchemas } from "../services/credentials/credential-schemas";

/**
 * The release is its own audited command, never a side effect of an edit: it makes username,
 * secret and note readable for contacts holding the portal credential role.
 */
export async function setCredentialPortalVisibility(
  id: string,
  input: SetCredentialPortalVisibilityRequestDto,
  actor: WorkspaceActor,
): Promise<CredentialResult<CredentialDto>> {
  if (!credentialSchemas.id.safeParse(id).success)
    return { ok: false, code: E.NotFound };
  const parsed = credentialSchemas.portalVisibility.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const { version, visibleToCustomer } = parsed.data;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const row = await credentialAccessService.lock(
      tx,
      id,
      actor,
      Permission.CredentialsWrite,
    );
    if (!row) return { ok: false, code: E.NotFound };
    if (row.version !== version)
      return versionConflict(
        row.version,
        credentialMappingService.fromRow(row, actor),
      );
    const visibilityError = await credentialAccessService.portalVisibilityError(
      tx,
      row,
      visibleToCustomer,
    );
    if (visibilityError) return { ok: false, code: visibilityError };
    // Nothing differs: no write, no version bump and no audit entry for a non-event.
    if (row.visible_to_customer === visibleToCustomer)
      return { ok: true, value: credentialMappingService.fromRow(row, actor) };

    const write = await updateVersioned({
      tx,
      table: customerCredentials,
      id,
      expectedVersion: version,
      patch: { visible_to_customer: visibleToCustomer },
      toDto: (updated) => credentialMappingService.fromRow(updated, actor),
    });
    if (!write.ok)
      throw new Error("Locked credential disappeared during release change");
    await credentialEventService.record(tx, {
      type: SecurityEventType.CredentialPortalVisibilityChanged,
      actor: { type: ActorType.User, userId: actor.userId },
      credential: row,
      visible: visibleToCustomer,
      occurredAt: new Date(),
    });
    return { ok: true, value: write.value };
  });
}
