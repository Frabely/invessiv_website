import { randomUUID } from "node:crypto";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  or,
  sql as drizzleSql,
} from "drizzle-orm";

import {
  ACTIVITY_TYPE_VALUES,
  ActivityType,
} from "@invessiv/common/constants/activity/activity-types";
import {
  ACTOR_TYPE_VALUES,
  ActorType,
} from "@invessiv/common/constants/activity/actor-types";
import { SystemActorKey } from "@invessiv/common/constants/activity/system-actor-keys";
import { getDatabaseClient, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  leadActivities,
  leads,
} from "@invessiv/db/record-configuration";

import { hasSameValues, readCheckConstraintValues } from "./constraint-catalog";
import {
  configureDatabaseUrlFromTarget,
  type DatabaseTarget,
  parseDatabaseTarget,
} from "./database-target";

const ALLOWED_TARGETS: DatabaseTarget[] = ["development", "preview"];
const FIXTURE_PREFIX = "fixture:activity-migration:";

type Check = { name: string; ok: boolean; detail?: string };

async function run() {
  const target = parseDatabaseTarget(process.argv);
  if (!target || !ALLOWED_TARGETS.includes(target)) {
    throw new Error(
      `Activity migration smoke requires one of: ${ALLOWED_TARGETS.join(", ")}.`,
    );
  }

  configureDatabaseUrlFromTarget(target);
  const db = getDrizzleDatabaseClient();
  const sql = getDatabaseClient();
  const leadId = randomUUID();
  const checks: Check[] = [];
  const occurredAt = new Date("2026-09-12T12:00:00.000Z");

  const record = (name: string, ok: boolean, detail?: string) => {
    checks.push({ name, ok, detail });
  };

  const expectRejected = async (
    name: string,
    action: () => Promise<unknown>,
  ) => {
    try {
      await action();
      record(name, false, "was accepted, expected a rejection");
    } catch {
      record(name, true);
    }
  };

  try {
    const mismatchedLegacyRows = await db
      .select({ id: leadActivities.id })
      .from(leadActivities)
      .leftJoin(activities, eq(activities.id, leadActivities.id))
      .where(
        or(
          isNull(activities.id),
          drizzleSql`${activities.lead_id} is distinct from ${leadActivities.lead_id}`,
          drizzleSql`${activities.customer_id} is not null`,
          drizzleSql`${activities.project_id} is not null`,
          drizzleSql`${activities.type} is distinct from ${leadActivities.type}`,
          drizzleSql`${activities.title} is distinct from ${leadActivities.title}`,
          drizzleSql`${activities.body} is distinct from ${leadActivities.body}`,
          drizzleSql`${activities.metadata} is distinct from ${leadActivities.metadata}`,
          drizzleSql`${activities.occurred_at} is distinct from ${leadActivities.occurred_at}`,
          drizzleSql`${activities.actor_type} is distinct from ${leadActivities.actor_type}`,
          drizzleSql`${activities.actor_id} is distinct from ${leadActivities.actor_id}`,
          drizzleSql`${activities.actor_label} is distinct from ${leadActivities.actor_label}`,
          drizzleSql`${activities.created_at} is distinct from ${leadActivities.created_at}`,
        ),
      )
      .limit(10);
    record(
      "every legacy lead activity exists completely unchanged in activities",
      mismatchedLegacyRows.length === 0,
      mismatchedLegacyRows.map((row) => row.id).join(", "),
    );

    const checkValues = await readCheckConstraintValues(
      sql,
      getTableConfig(activities).name,
    );
    const typeValues = checkValues.get("activities_type_check") ?? [];
    const actorTypeValues =
      checkValues.get("activities_actor_type_check") ?? [];
    record(
      "type CHECK matches ACTIVITY_TYPE_VALUES",
      hasSameValues(typeValues, ACTIVITY_TYPE_VALUES),
      typeValues.join(", "),
    );
    record(
      "actor type CHECK matches ACTOR_TYPE_VALUES",
      hasSameValues(actorTypeValues, ACTOR_TYPE_VALUES),
      actorTypeValues.join(", "),
    );

    await db.insert(leads).values({
      id: leadId,
      display_name: `${FIXTURE_PREFIX}${leadId}`,
      source: "manual",
      lead_status: "new",
      created_at: occurredAt,
      updated_at: occurredAt,
    });

    await expectRejected(
      "activity without lead or customer is rejected",
      () => sql`
                INSERT INTO activities
                    (id, type, actor_type, occurred_at, created_at)
                VALUES (${randomUUID()}, 'note', 'system', ${occurredAt}, ${occurredAt})
            `,
    );
    await expectRejected(
      "activity without id is rejected",
      () => sql`
                INSERT INTO activities
                    (lead_id, type, actor_type, occurred_at, created_at)
                VALUES (${leadId}, 'note', 'system', ${occurredAt}, ${occurredAt})
            `,
    );
    await expectRejected(
      "activity without type is rejected",
      () => sql`
                INSERT INTO activities
                    (id, lead_id, actor_type, occurred_at, created_at)
                VALUES (${randomUUID()}, ${leadId}, 'system', ${occurredAt}, ${occurredAt})
            `,
    );
    await expectRejected(
      "activity without occurred_at is rejected",
      () => sql`
                INSERT INTO activities
                    (id, lead_id, type, actor_type, created_at)
                VALUES (${randomUUID()}, ${leadId}, 'note', 'system', ${occurredAt})
            `,
    );
    await expectRejected(
      "activity without actor type is rejected",
      () => sql`
                INSERT INTO activities
                    (id, lead_id, type, occurred_at, created_at)
                VALUES (${randomUUID()}, ${leadId}, 'note', ${occurredAt}, ${occurredAt})
            `,
    );
    await expectRejected(
      "unknown activity type is rejected",
      () => sql`
                INSERT INTO activities
                    (id, lead_id, type, actor_type, occurred_at, created_at)
                VALUES (${randomUUID()}, ${leadId}, 'unknown', 'system', ${occurredAt}, ${occurredAt})
            `,
    );
    await expectRejected(
      "unknown actor type is rejected",
      () => sql`
                INSERT INTO activities
                    (id, lead_id, type, actor_type, occurred_at, created_at)
                VALUES (${randomUUID()}, ${leadId}, 'note', 'unknown', ${occurredAt}, ${occurredAt})
            `,
    );
    await expectRejected(
      "unknown lead reference is rejected",
      () => sql`
                INSERT INTO activities
                    (id, lead_id, type, actor_type, occurred_at, created_at)
                VALUES (${randomUUID()}, ${randomUUID()}, 'note', 'system', ${occurredAt}, ${occurredAt})
            `,
    );
    await expectRejected(
      "unknown customer reference is rejected",
      () => sql`
                INSERT INTO activities
                    (id, customer_id, type, actor_type, occurred_at, created_at)
                VALUES (${randomUUID()}, ${randomUUID()}, 'created', 'system', ${occurredAt}, ${occurredAt})
            `,
    );

    const orderedIds = [randomUUID(), randomUUID()];
    await db.insert(activities).values(
      orderedIds.map((id) => ({
        id,
        lead_id: leadId,
        customer_id: null,
        project_id: null,
        type: ActivityType.Note,
        title: null,
        body: null,
        metadata: null,
        occurred_at: occurredAt,
        actor_type: ActorType.System,
        actor_user_id: null,
        system_actor_key: SystemActorKey.Fixture,
        actor_id: null,
        actor_label: null,
        created_at: occurredAt,
      })),
    );
    const timelineRows = await db
      .select({ id: activities.id })
      .from(activities)
      .where(
        and(eq(activities.lead_id, leadId), inArray(activities.id, orderedIds)),
      )
      .orderBy(desc(activities.occurred_at), desc(activities.id));
    record(
      "equal timestamps are ordered deterministically by id",
      timelineRows.map((row) => row.id).join(",") ===
        [...orderedIds].sort().reverse().join(","),
    );
  } finally {
    await db.delete(leads).where(eq(leads.id, leadId));
  }

  for (const check of checks) {
    console.log(`${check.ok ? "ok  " : "FAIL"} ${check.name}`);
    if (!check.ok && check.detail) console.log(`     ${check.detail}`);
  }

  const failures = checks.filter((check) => !check.ok);
  if (failures.length > 0) {
    throw new Error(
      `${failures.length} of ${checks.length} activity migration checks failed.`,
    );
  }

  console.log(`All ${checks.length} activity migration checks passed.`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
