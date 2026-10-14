import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { sql } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  findWorkspaceRoot,
  getDrizzleDatabaseClient,
  type ContactDatabaseTransaction,
} from "@invessiv/db/core";
import { ActivitiesConstraintName } from "@invessiv/db/constraint-names/activities-constraint-names";

vi.mock("server-only", () => ({}));

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const migration = readFileSync(
  path.join(
    findWorkspaceRoot(process.cwd()),
    "packages/db/migrations/0058_backfill_legacy_activity_actors.sql",
  ),
  "utf8",
).split(/^-->\s*statement-breakpoint\s*$/gm);

async function applyMigration(tx: ContactDatabaseTransaction) {
  for (const statement of migration) await tx.execute(sql.raw(statement));
}

async function withLegacyTables(
  ownerCount: number,
  callback: (tx: ContactDatabaseTransaction) => Promise<void>,
) {
  await getDrizzleDatabaseClient().transaction(async (tx) => {
    // Temporary tables shadow the live schema and disappear at commit or rollback.
    for (const statement of [
      "CREATE TEMP TABLE users (id UUID PRIMARY KEY, active BOOLEAN NOT NULL) ON COMMIT DROP",
      "CREATE TEMP TABLE workspace_members (id UUID PRIMARY KEY, user_id UUID NOT NULL, active BOOLEAN NOT NULL) ON COMMIT DROP",
      "CREATE TEMP TABLE roles (id UUID PRIMARY KEY, realm TEXT NOT NULL, system_key TEXT, active BOOLEAN NOT NULL, is_system BOOLEAN NOT NULL) ON COMMIT DROP",
      "CREATE TEMP TABLE workspace_member_roles (workspace_member_id UUID NOT NULL, role_id UUID NOT NULL, role_realm TEXT NOT NULL) ON COMMIT DROP",
      "CREATE TEMP TABLE activities (id INTEGER PRIMARY KEY, actor_type TEXT NOT NULL, actor_user_id UUID REFERENCES pg_temp.users(id), system_actor_key TEXT, actor_id TEXT, actor_label TEXT, customer_id UUID) ON COMMIT DROP",
    ])
      await tx.execute(sql.raw(statement));
    await tx.execute(sql`
      INSERT INTO pg_temp.users VALUES (${OWNER_ID}::uuid, true), (${OTHER_USER_ID}::uuid, true)
    `);
    for (let index = 0; index < ownerCount; index++) {
      const userId = index === 0 ? OWNER_ID : OTHER_USER_ID;
      const memberId = randomUUID();
      await tx.execute(sql`
        INSERT INTO pg_temp.workspace_members VALUES (${memberId}::uuid, ${userId}::uuid, true)
      `);
      await tx.execute(sql`
        INSERT INTO pg_temp.roles VALUES (${userId}::uuid, 'workspace', 'workspace_owner', true, true)
      `);
      await tx.execute(sql`
        INSERT INTO pg_temp.workspace_member_roles VALUES (${memberId}::uuid, ${userId}::uuid, 'workspace')
      `);
    }
    await tx.execute(sql`
      INSERT INTO pg_temp.activities VALUES
        (1, 'user', NULL, NULL, 'user_legacy', 'Historical owner', NULL),
        (2, 'system', NULL, NULL, NULL, 'Historical import', NULL),
        (3, 'user', ${OTHER_USER_ID}::uuid, NULL, NULL, NULL, NULL),
        (4, 'system', NULL, 'fixture', NULL, NULL, NULL)
    `);
    await tx.execute(
      sql.raw(`
      ALTER TABLE pg_temp.activities ADD CONSTRAINT ${ActivitiesConstraintName.ActorCheck} CHECK (
        (actor_type IN ('user', 'customer') AND actor_user_id IS NOT NULL AND system_actor_key IS NULL)
        OR (actor_type = 'system' AND system_actor_key IS NOT NULL AND btrim(system_actor_key) <> '' AND actor_user_id IS NULL)
      ) NOT VALID
    `),
    );
    await callback(tx);
  });
}

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "legacy activity actor migration",
  () => {
    beforeAll(() => {
      const loaded = loadDotenv({
        path: path.join(
          findWorkspaceRoot(process.cwd()),
          ".env.development.local",
        ),
        quiet: true,
      });
      const databaseUrl =
        process.env.DATABASE_URL_DEVELOPMENT?.trim() ||
        loaded.parsed?.DATABASE_URL?.trim();
      if (!databaseUrl)
        throw new Error("Development database URL is not configured.");
      process.env.DATABASE_URL = databaseUrl;
    });

    it("repairs legacy actors, preserves modern actors and allows history linking on repeated runs", async () => {
      await withLegacyTables(1, async (tx) => {
        await expect(
          tx.transaction((savepoint) =>
            savepoint.execute(sql`
          UPDATE pg_temp.activities SET customer_id = ${OWNER_ID}::uuid
        `),
          ),
        ).rejects.toThrow();

        await applyMigration(tx);
        await applyMigration(tx);
        await tx.execute(
          sql`UPDATE pg_temp.activities SET customer_id = ${OWNER_ID}::uuid`,
        );
        const result = await tx.execute(
          sql`SELECT * FROM pg_temp.activities ORDER BY id`,
        );
        expect(result.rows).toEqual([
          {
            id: 1,
            actor_type: "user",
            actor_user_id: OWNER_ID,
            system_actor_key: null,
            actor_id: "user_legacy",
            actor_label: "Historical owner",
            customer_id: OWNER_ID,
          },
          {
            id: 2,
            actor_type: "system",
            actor_user_id: null,
            system_actor_key: "legacy",
            actor_id: null,
            actor_label: "Historical import",
            customer_id: OWNER_ID,
          },
          {
            id: 3,
            actor_type: "user",
            actor_user_id: OTHER_USER_ID,
            system_actor_key: null,
            actor_id: null,
            actor_label: null,
            customer_id: OWNER_ID,
          },
          {
            id: 4,
            actor_type: "system",
            actor_user_id: null,
            system_actor_key: "fixture",
            actor_id: null,
            actor_label: null,
            customer_id: OWNER_ID,
          },
        ]);
        const constraint = await tx.execute(sql`
          SELECT convalidated FROM pg_constraint
          WHERE conrelid = 'pg_temp.activities'::regclass
            AND conname = ${ActivitiesConstraintName.ActorCheck}
        `);
        expect(constraint.rows).toEqual([{ convalidated: true }]);
      });
    });

    it.each([0, 2])(
      "refuses ambiguous attribution with %i active owners",
      async (ownerCount) => {
        await expect(
          withLegacyTables(ownerCount, applyMigration),
        ).rejects.toThrow();
      },
    );

    it("needs no owner when there are no legacy human activities", async () => {
      await withLegacyTables(0, async (tx) => {
        await tx.execute(sql`DELETE FROM pg_temp.activities WHERE id = 1`);
        await applyMigration(tx);
        const result = await tx.execute(
          sql`SELECT system_actor_key FROM pg_temp.activities WHERE id = 2`,
        );
        expect(result.rows).toEqual([{ system_actor_key: "legacy" }]);
      });
    });
  },
);
