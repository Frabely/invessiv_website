import type { Column } from "drizzle-orm";
import { sql } from "drizzle-orm";

import {
  HUMAN_ACTOR_TYPE_VALUES,
  SYSTEM_ACTOR_TYPE_VALUES,
} from "@invessiv/common/constants/activity/actor-types";

/**
 * Builds a SQL IN-check from a trusted as-const array (e.g., LEAD_SOURCES_VALUES).
 * Uses sql.raw, so the values are inlined, not parameterized. Only pass
 * compile-time constants from readonly tuples derived from const objects.
 */
export function sqlCheckIn<
  const TValues extends readonly [string, ...string[]],
>(column: Column, values: TValues) {
  const list = values.map((v) => `'${v}'`).join(", ");
  return sql`${column} in (${sql.raw(list)})`;
}

/**
 * A human actor references a user and no system key; a system actor carries a key and no user.
 * Shared by `activities` and `security_events` so both tables enforce the same invariant.
 */
export function sqlActorInvariant(columns: {
  actorType: Column;
  actorUserId: Column;
  systemActorKey: Column;
}) {
  return sql`(${sqlCheckIn(columns.actorType, HUMAN_ACTOR_TYPE_VALUES)} and ${columns.actorUserId} is not null and ${columns.systemActorKey} is null)
             or (
             ${sqlCheckIn(columns.actorType, SYSTEM_ACTOR_TYPE_VALUES)}
             and
             ${columns.systemActorKey}
             is
             not
             null
             and
             btrim
             (
             ${columns.systemActorKey}
             )
             <>
             ''
             and
             ${columns.actorUserId}
             is
             null
             )`;
}
