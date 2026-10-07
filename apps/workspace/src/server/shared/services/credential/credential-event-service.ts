import "server-only";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { securityEventService } from "@/server/shared/services/security-event-service";
import type {
  CredentialEventDetail,
  CredentialEventInput,
} from "./credential-event-types";

function detailMetadata(
  detail: CredentialEventDetail,
): Record<string, unknown> {
  switch (detail.type) {
    case SecurityEventType.CredentialUpdated:
      return { changed_fields: detail.changedFields };
    case SecurityEventType.CredentialRevealed:
      return { field: detail.field, intent: detail.intent };
    case SecurityEventType.CredentialPortalVisibilityChanged:
      return { visible: detail.visible };
    default:
      return {};
  }
}

/**
 * Writes in the caller's transaction: if the event cannot be stored, the business write rolls back
 * with it — a reveal then returns no plaintext.
 */
async function record(
  tx: ContactDatabaseTransaction,
  input: CredentialEventInput,
): Promise<void> {
  await securityEventService.createSecurityEvent(tx, {
    type: input.type,
    actor: input.actor,
    subjectType: SecuritySubjectType.Credential,
    subjectId: input.credential.id,
    metadata: {
      customer_id: input.credential.customer_id,
      project_id: input.credential.project_id,
      ...detailMetadata(input),
    },
    occurredAt: input.occurredAt,
  });
}

export const credentialEventService = { record } as const;
