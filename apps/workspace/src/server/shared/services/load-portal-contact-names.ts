import "server-only";

import { eq, inArray } from "drizzle-orm";

import { people, portalMemberships } from "@invessiv/db/record-configuration";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";

/**
 * Display names of contacts by portal membership, so two contacts of one company see who edited or
 * submitted last. A removed membership simply has no name.
 */
export async function loadPortalContactNames(
  executor: Pick<ContactDatabaseTransaction, "select">,
  membershipIds: readonly (string | null)[],
): Promise<ReadonlyMap<string, string>> {
  const ids = [...new Set(membershipIds.filter((id) => id !== null))];
  if (ids.length === 0) return new Map();
  const rows = await executor
    .select({ id: portalMemberships.id, name: people.display_name })
    .from(portalMemberships)
    .innerJoin(people, eq(people.id, portalMemberships.person_id))
    .where(inArray(portalMemberships.id, ids));
  return new Map(rows.map((row) => [row.id, row.name]));
}
