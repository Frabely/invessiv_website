import "server-only";
import { and, desc, eq, gt } from "drizzle-orm";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { securityEvents, users } from "@invessiv/db/record-configuration";

type FindRetryAfterInput = {
  actorUserId: string;
  /** Reveals allowed per window; differs between workspace and portal. */
  limit: number;
  now: Date;
};

/**
 * Seconds until the oldest counted reveal leaves the window, or null below the limit. Locks the
 * user's own row first, so parallel reveals of one person cannot all pass the same count. The lock
 * is `NO KEY UPDATE`: it serialises these requests without blocking the foreign-key check of
 * unrelated event inserts for the same user.
 */
async function findRetryAfter(
  tx: ContactDatabaseTransaction,
  { actorUserId, limit, now }: FindRetryAfterInput,
): Promise<number | null> {
  await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, actorUserId))
    .for("no key update");
  const windowMs = CREDENTIAL_LIMITS.revealWindowSeconds * 1000;
  const counted = await tx
    .select({ occurredAt: securityEvents.occurred_at })
    .from(securityEvents)
    .where(
      and(
        eq(securityEvents.type, SecurityEventType.CredentialRevealed),
        eq(securityEvents.actor_user_id, actorUserId),
        gt(securityEvents.occurred_at, new Date(now.getTime() - windowMs)),
      ),
    )
    .orderBy(desc(securityEvents.occurred_at))
    .limit(limit);
  const oldest = counted.at(-1);
  if (counted.length < limit || !oldest) return null;
  return Math.max(
    1,
    Math.ceil((oldest.occurredAt.getTime() + windowMs - now.getTime()) / 1000),
  );
}

export const credentialRevealLimitService = { findRetryAfter } as const;
