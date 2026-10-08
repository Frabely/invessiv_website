import "server-only";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import type { CreateCredentialRequestDto } from "@invessiv/common/contracts/credentials/create-credential-request.dto";
import type { CredentialResult } from "@invessiv/common/contracts/credentials/credential-result";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";
import { credentialEventService } from "@/server/shared/services/credential/credential-event-service";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { credentialWriteService } from "@/server/shared/services/credential/credential-write-service";
import { credentialAccessService } from "../services/credentials/credential-access-service";
import { credentialMappingService } from "../services/credentials/credential-mapping-service";
import { credentialSchemas } from "../services/credentials/credential-schemas";

/**
 * An entry is internal unless the request releases it. A release at creation follows the same
 * rule and leaves the same audit trail as a later one: a project the portal does not show is
 * refused, and the release gets its own event next to the creation.
 */
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
    const visibleToCustomer = data.visibleToCustomer === true;
    const visibilityError = await credentialAccessService.portalVisibilityError(
      tx,
      {
        created_by_side: CredentialSide.Internal,
        visible_to_customer: false,
        project_id: data.projectId,
      },
      visibleToCustomer,
    );
    if (visibilityError) return { ok: false, code: visibilityError };
    const now = new Date();
    const eventActor = { type: ActorType.User, userId: actor.userId } as const;
    const row = await credentialWriteService.insert(tx, {
      ...data,
      customerId,
      visibleToCustomer,
      origin: { memberId: actor.workspaceMemberId },
      now,
    });
    await credentialEventService.record(tx, {
      type: SecurityEventType.CredentialCreated,
      actor: eventActor,
      credential: row,
      occurredAt: now,
    });
    if (visibleToCustomer)
      await credentialEventService.record(tx, {
        type: SecurityEventType.CredentialPortalVisibilityChanged,
        actor: eventActor,
        credential: row,
        visible: true,
        occurredAt: now,
      });
    return { ok: true, value: credentialMappingService.fromRow(row, actor) };
  });
}
