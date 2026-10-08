import "server-only";
import { count, eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CredentialApiErrorCode as E } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import type { CreatePortalCredentialRequestDto } from "@invessiv/common/contracts/portal/create-portal-credential-request.dto";
import type { PortalCredentialCreatedDto } from "@invessiv/common/contracts/portal/portal-credential-created.dto";
import type { PortalCredentialResult } from "@invessiv/common/contracts/portal/results/portal-credential-result";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customerCredentials,
  customers,
} from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalActivityActor } from "@/server/portal/auth/portal-activity-actor";
import { portalCredentialMappingService } from "@/server/portal/services/credentials/portal-credential-mapping-service";
import { portalCredentialSchemas } from "@/server/portal/services/credentials/portal-credential-schemas";
import { portalCredentialService } from "@/server/portal/services/credentials/portal-credential-service";
import { credentialCryptoService } from "@/server/shared/services/credential/credential-crypto-service";
import { credentialEventService } from "@/server/shared/services/credential/credential-event-service";
import { credentialWriteService } from "@/server/shared/services/credential/credential-write-service";
import { announceSystemMessage } from "@/server/shared/services/message/announce-system-message";

/**
 * A contact hands over a credential. The company comes from the actor, never from the request, and
 * the entry is visible to the customer from the start (the table demands it for customer entries).
 * The chat notice names neither the title nor a value.
 */
export async function createPortalCredential(
  actor: PortalActor,
  input: CreatePortalCredentialRequestDto,
): Promise<PortalCredentialResult<PortalCredentialCreatedDto>> {
  if (!portalCredentialService.can(actor, Permission.PortalCredentialsWrite))
    return { ok: false, code: E.NotFound };
  const parsed = portalCredentialSchemas.create.safeParse(input);
  if (!parsed.success) return { ok: false, code: E.Validation };
  const data = parsed.data;
  if (!credentialCryptoService.isConfigured())
    return { ok: false, code: E.NotConfigured };
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    // Serialises additions per company, so parallel requests cannot pass the upper bound. The lock
    // is `NO KEY UPDATE`: it does not block foreign-key checks of unrelated inserts.
    await tx
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, actor.customerId))
      .for("no key update");
    const [existing] = await tx
      .select({ total: count() })
      .from(customerCredentials)
      .where(eq(customerCredentials.customer_id, actor.customerId));
    if ((existing?.total ?? 0) >= CREDENTIAL_LIMITS.maxPortalCreatedPerCustomer)
      return { ok: false, code: E.Validation };
    if (
      !(await portalCredentialService.targetExists(
        tx,
        actor,
        data.projectId,
        Permission.PortalCredentialsWrite,
      ))
    )
      return { ok: false, code: E.Validation };

    const now = new Date();
    const row = await credentialWriteService.insert(tx, {
      ...data,
      customerId: actor.customerId,
      visibleToCustomer: true,
      origin: { portalMembershipId: actor.membershipId },
      now,
    });
    await credentialEventService.record(tx, {
      type: SecurityEventType.CredentialCreated,
      actor: portalActivityActor(actor),
      credential: row,
      occurredAt: now,
    });
    await announceSystemMessage(
      tx,
      actor.customerId,
      SystemMessageKey.CredentialAddedByCustomer,
      {},
    );
    return {
      ok: true,
      value: {
        created: true,
        credential: portalCredentialService.can(
          actor,
          Permission.PortalCredentialsRead,
        )
          ? portalCredentialMappingService.fromRow(row)
          : null,
      },
    };
  });
}
