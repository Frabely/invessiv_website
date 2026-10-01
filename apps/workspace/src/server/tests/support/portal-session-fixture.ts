import { inArray } from "drizzle-orm";

import { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { people, users } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { resolvePortalActor } from "@/server/portal/query-handler/resolve-portal-actor.query-handler";
import { insertStandardPortalMembership } from "./portal-membership-fixture";

/**
 * Contacts with the standard portal role, resolved like a request would resolve them. Memberships
 * go with their customer; users and people are removed by `cleanup`.
 */
export function createPortalSessionFixture(
  database: () => ReturnType<typeof getDrizzleDatabaseClient>,
  assignedByMemberId: string,
  prefix: string,
) {
  const userIds: string[] = [];
  const personIds: string[] = [];

  async function session(
    customerId: string,
    displayName = prefix,
  ): Promise<PortalActor> {
    const userId = crypto.randomUUID();
    const personId = crypto.randomUUID();
    userIds.push(userId);
    personIds.push(personId);
    const db = database();
    await db.insert(users).values({
      id: userId,
      clerk_user_id: prefix + userId,
      primary_email: `${userId}@example.test`,
      display_name: displayName,
      active: true,
      version: 1,
    });
    await db.insert(people).values({
      id: personId,
      display_name: displayName,
      preferred_locale: Locale.De,
      version: 1,
    });
    await insertStandardPortalMembership(db, {
      customerId,
      personId,
      userId,
      assignedByMemberId,
      isPrimary: false,
    });
    const resolved = await resolvePortalActor(prefix + userId, customerId);
    if (!resolved.ok) throw new Error("Expected a resolved portal session");
    return resolved.actor;
  }

  async function cleanup() {
    const db = database();
    if (personIds.length > 0)
      await db.delete(people).where(inArray(people.id, personIds));
    if (userIds.length > 0)
      await db.delete(users).where(inArray(users.id, userIds));
  }

  return { session, cleanup };
}
