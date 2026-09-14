import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { ACTOR_TYPE_VALUES } from "@invessiv/common/constants/activity/actor-types";
import { SECURITY_EVENT_TYPE_VALUES } from "@invessiv/common/constants/auth/security-event-types";
import { SECURITY_SUBJECT_TYPE_VALUES } from "@invessiv/common/constants/auth/security-subject-types";
import { SecurityEventsConstraintName } from "@invessiv/db/constraint-names/auth/security-events-constraint-names";
import { sqlActorInvariant, sqlCheckIn } from "@invessiv/db/core";
import { users } from "@invessiv/db/record-configuration/auth/users";

/**
 * Append-only security log. Migration 0024 rejects updates and deletes through a database trigger;
 * fixture cleanup needs the explicit transaction-local maintenance switch. `subject_id`
 * deliberately has no foreign key so the log survives later purges of the subject.
 */
export const securityEvents = pgTable(
  "security_events",
  {
    id: uuid("id").primaryKey(),
    type: text("type", { enum: SECURITY_EVENT_TYPE_VALUES }).notNull(),
    actor_type: text("actor_type", { enum: ACTOR_TYPE_VALUES }).notNull(),
    actor_user_id: uuid("actor_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    system_actor_key: text("system_actor_key"),
    subject_type: text("subject_type", {
      enum: SECURITY_SUBJECT_TYPE_VALUES,
    }).notNull(),
    subject_id: uuid("subject_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    occurred_at: timestamp("occurred_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      SecurityEventsConstraintName.TypeCheck,
      sqlCheckIn(table.type, SECURITY_EVENT_TYPE_VALUES),
    ),
    check(
      SecurityEventsConstraintName.ActorTypeCheck,
      sqlCheckIn(table.actor_type, ACTOR_TYPE_VALUES),
    ),
    check(
      SecurityEventsConstraintName.SubjectTypeCheck,
      sqlCheckIn(table.subject_type, SECURITY_SUBJECT_TYPE_VALUES),
    ),
    check(
      SecurityEventsConstraintName.ActorCheck,
      sqlActorInvariant({
        actorType: table.actor_type,
        actorUserId: table.actor_user_id,
        systemActorKey: table.system_actor_key,
      }),
    ),
    index(SecurityEventsConstraintName.SubjectOccurredAtIndex).on(
      table.subject_type,
      table.subject_id,
      table.occurred_at.desc(),
    ),
    index(SecurityEventsConstraintName.OccurredAtIndex).on(
      table.occurred_at.desc(),
    ),
  ],
);
