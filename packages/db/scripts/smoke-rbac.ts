/**
 * Verifies the invariants of users, roles, permissions and actor references against a real database.
 *
 * Realm separation and delegability must be rejected by Postgres itself, so a mocked unit test cannot
 * prove them. Every row carries a fixture prefix and is removed at the end — even if a check fails.
 */
import { randomUUID } from "node:crypto";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SECURITY_EVENT_TYPE_VALUES } from "@invessiv/common/constants/auth/security-event-types";
import { SECURITY_SUBJECT_TYPE_VALUES } from "@invessiv/common/constants/auth/security-subject-types";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import {
  type ContactDatabase,
  getDatabaseClient,
  getDatabaseUrl,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { AUTH_CONSTRAINT_NAME_VALUES } from "@invessiv/db/record-configuration/auth/auth-constraint-names";
import {
  configureDatabaseUrlFromTarget,
  type DatabaseTarget,
  parseDatabaseTarget,
} from "./database-target";
import { findRbacCatalogMismatches } from "./rbac-catalog-check";

const FIXTURE_PREFIX = "smoke:rbac:";
const ALLOWED_TARGETS: DatabaseTarget[] = ["development", "preview"];

type Sql = ReturnType<typeof getDatabaseClient>;

const checks: { name: string; ok: boolean; detail?: string }[] = [];

function record(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
}

async function expectRejected(name: string, run: () => Promise<unknown>) {
  try {
    await run();
    record(name, false, "was accepted, expected a rejection");
  } catch {
    record(name, true);
  }
}

async function expectAccepted(name: string, run: () => Promise<unknown>) {
  try {
    await run();
    record(name, true);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    record(name, false, message);
  }
}

const fixture = (suffix: string) => `${FIXTURE_PREFIX}${suffix}`;

async function insertUser(sql: Sql, id = randomUUID()) {
  await sql`
    INSERT INTO users (id, clerk_user_id, primary_email, display_name, active, version)
    VALUES (${id}, ${fixture(id)}, ${fixture(`${id}@example.test`)}, ${fixture("User")}, TRUE, 1)
  `;
  return id;
}

async function insertMember(sql: Sql, userId: string) {
  const id = randomUUID();
  await sql`
    INSERT INTO workspace_members (id, user_id, active, version)
    VALUES (${id}, ${userId}, TRUE, 1)
  `;
  return id;
}

async function insertRole(
  sql: Sql,
  args: { realm: "workspace" | "portal"; name: string },
) {
  const id = randomUUID();
  await sql`
    INSERT INTO roles (id, realm, system_key, name, is_system, active, version)
    VALUES (${id}, ${args.realm}, NULL, ${args.name}, FALSE, TRUE, 1)
  `;
  return id;
}

async function runCatalogChecks(db: ContactDatabase) {
  const mismatches = await findRbacCatalogMismatches(db);
  record(
    "permission catalog and system roles match the code",
    mismatches.length === 0,
    mismatches.join("; "),
  );
}

async function runUserAndMemberChecks(sql: Sql) {
  const userId = await insertUser(sql);
  record("user with required fields can be created", true);

  await expectRejected(
    "duplicate clerk user id is rejected",
    () =>
      sql`
      INSERT INTO users (id, clerk_user_id, primary_email, display_name, active, version)
      VALUES (${randomUUID()}, ${fixture(userId)}, ${fixture("dup@example.test")}, ${fixture("Dup")}, TRUE, 1)
    `,
  );
  await expectRejected(
    "blank display name is rejected",
    () =>
      sql`
      INSERT INTO users (id, clerk_user_id, primary_email, display_name, active, version)
      VALUES (${randomUUID()}, ${fixture(randomUUID())}, ${fixture("blank@example.test")}, '   ', TRUE, 1)
    `,
  );
  await expectRejected(
    "user without active flag is rejected",
    () =>
      sql`
      INSERT INTO users (id, clerk_user_id, primary_email, display_name, version)
      VALUES (${randomUUID()}, ${fixture(randomUUID())}, ${fixture("noactive@example.test")}, ${fixture("No active")}, 1)
    `,
  );
  await expectRejected(
    "user without version is rejected",
    () =>
      sql`
      INSERT INTO users (id, clerk_user_id, primary_email, display_name, active)
      VALUES (${randomUUID()}, ${fixture(randomUUID())}, ${fixture("noversion@example.test")}, ${fixture("No version")}, TRUE)
    `,
  );

  await insertMember(sql, userId);
  record("member referencing a user can be created", true);

  await expectRejected("second membership for the same user is rejected", () =>
    insertMember(sql, userId),
  );
  await expectRejected(
    "member without user is rejected",
    () =>
      sql`
      INSERT INTO workspace_members (id, active, version)
      VALUES (${randomUUID()}, TRUE, 1)
    `,
  );
  await expectRejected("member with an unknown user is rejected", () =>
    insertMember(sql, randomUUID()),
  );

  const legacyColumns = (await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'workspace_members'
      AND column_name IN ('clerk_user_id', 'email', 'role', 'credentials_access')
  `) as { column_name: string }[];
  record(
    "legacy identity columns are gone from workspace_members",
    legacyColumns.length === 0,
    legacyColumns.map((row) => row.column_name).join(", "),
  );
}

async function runRoleChecks(sql: Sql) {
  const actorUserId = await insertUser(sql);
  const memberId = await insertMember(sql, await insertUser(sql));
  const customRoleId = await insertRole(sql, {
    realm: "workspace",
    name: fixture("Sales"),
  });
  const portalRoleId = await insertRole(sql, {
    realm: "portal",
    name: fixture("Sales"),
  });
  record(
    "the same role name is allowed in different realms",
    Boolean(portalRoleId),
  );

  await expectRejected(
    "duplicate role name in the same realm is rejected",
    () => insertRole(sql, { realm: "workspace", name: fixture("SALES ") }),
  );
  await expectRejected(
    "custom role with a system key is rejected",
    () =>
      sql`
      INSERT INTO roles (id, realm, system_key, name, is_system, active, version)
      VALUES (${randomUUID()}, 'workspace', 'workspace_owner', ${fixture("Fake owner")}, FALSE, TRUE, 1)
    `,
  );
  await expectRejected(
    "system role without a system key is rejected",
    () =>
      sql`
      INSERT INTO roles (id, realm, system_key, name, is_system, active, version)
      VALUES (${randomUUID()}, 'workspace', NULL, ${fixture("Fake system")}, TRUE, TRUE, 1)
    `,
  );
  await expectRejected(
    "role without active flag is rejected",
    () =>
      sql`
      INSERT INTO roles (id, realm, name, is_system, version)
      VALUES (${randomUUID()}, 'workspace', ${fixture("No active")}, FALSE, 1)
    `,
  );

  await expectAccepted(
    "custom role can hold a delegable permission",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
      VALUES (${customRoleId}, 'workspace', FALSE, ${Permission.LeadsRead}, TRUE)
    `,
  );
  await expectRejected(
    "custom role cannot hold a non-delegable permission (flag spoofed)",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
      VALUES (${customRoleId}, 'workspace', FALSE, ${Permission.RolesManage}, TRUE)
    `,
  );
  await expectRejected(
    "custom role cannot hold a non-delegable permission (flag honest)",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
      VALUES (${customRoleId}, 'workspace', FALSE, ${Permission.MembersManage}, FALSE)
    `,
  );
  await expectRejected(
    "custom role cannot claim to be a system role",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
      VALUES (${customRoleId}, 'workspace', TRUE, ${Permission.DataPurge}, FALSE)
    `,
  );
  await expectRejected(
    "portal role cannot hold a workspace permission (realm of role)",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
      VALUES (${portalRoleId}, 'portal', FALSE, ${Permission.LeadsRead}, TRUE)
    `,
  );
  await expectRejected(
    "portal role cannot hold a workspace permission (realm of permission)",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, permission_key, permission_delegable)
      VALUES (${portalRoleId}, 'workspace', FALSE, ${Permission.LeadsRead}, TRUE)
    `,
  );

  const assignedAt = new Date();
  await expectAccepted(
    "workspace role can be assigned to a member",
    () => sql`
      INSERT INTO workspace_member_roles (workspace_member_id, role_id, role_realm, assigned_by_user_id, assigned_at)
      VALUES (${memberId}, ${customRoleId}, 'workspace', ${actorUserId}, ${assignedAt})
    `,
  );
  await expectAccepted(
    "a member can hold several roles",
    () => sql`
      INSERT INTO workspace_member_roles (workspace_member_id, role_id, role_realm, assigned_by_user_id, assigned_at)
      VALUES (${memberId}, ${SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceMember].id}, 'workspace', ${actorUserId},
              ${assignedAt})
    `,
  );
  await expectRejected(
    "portal role cannot be assigned to a member (realm spoofed)",
    () => sql`
      INSERT INTO workspace_member_roles (workspace_member_id, role_id, role_realm, assigned_by_user_id, assigned_at)
      VALUES (${memberId}, ${portalRoleId}, 'workspace', ${actorUserId}, ${assignedAt})
    `,
  );
  await expectRejected(
    "portal role cannot be assigned to a member (realm honest)",
    () => sql`
      INSERT INTO workspace_member_roles (workspace_member_id, role_id, role_realm, assigned_by_user_id, assigned_at)
      VALUES (${memberId}, ${portalRoleId}, 'portal', ${actorUserId}, ${assignedAt})
    `,
  );
  // A fresh member and a valid workspace role: the rejection can only come from the missing value.
  const unassignedMemberId = await insertMember(sql, await insertUser(sql));
  await expectRejected(
    "role assignment without assigned_at is rejected",
    () => sql`
      INSERT INTO workspace_member_roles (workspace_member_id, role_id, role_realm, assigned_by_user_id)
      VALUES (${unassignedMemberId}, ${customRoleId}, 'workspace', ${actorUserId})
    `,
  );
  await expectRejected(
    "an assigned role cannot be deleted",
    () => sql`DELETE FROM roles WHERE id = ${customRoleId}`,
  );
  // Runs inside a DO block that always raises, so an unexpectedly accepted update is rolled back
  // instead of corrupting the shared catalog.
  const acceptedMarker = "rbac_smoke_update_accepted";
  try {
    await sql.query(`
      DO $$
      BEGIN
        UPDATE permissions SET delegable = FALSE WHERE key = '${Permission.LeadsRead}';
        RAISE EXCEPTION '${acceptedMarker}';
      END
      $$;
    `);
    record(
      "a permission used by a custom role cannot become non-delegable",
      false,
      "DO block finished without raising",
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    record(
      "a permission used by a custom role cannot become non-delegable",
      !message.includes(acceptedMarker),
      message,
    );
  }
}

async function runActorChecks(sql: Sql) {
  const userId = await insertUser(sql);
  const leadId = randomUUID();
  const now = new Date();
  await sql`
    INSERT INTO leads (id, display_name, source, lead_status, created_at, updated_at)
    VALUES (${leadId}, ${fixture(leadId)}, 'manual', 'new', ${now}, ${now})
  `;

  const insertActivity = (
    actorType: string,
    actorUserId: string | null,
    systemActorKey: string | null,
  ) => sql`
    INSERT INTO activities (id, lead_id, type, actor_type, actor_user_id, system_actor_key, occurred_at, created_at)
    VALUES (${randomUUID()}, ${leadId}, 'note', ${actorType}, ${actorUserId}, ${systemActorKey}, ${now}, ${now})
  `;

  await expectAccepted("user activity with a user reference is accepted", () =>
    insertActivity("user", userId, null),
  );
  await expectAccepted("system activity with a key is accepted", () =>
    insertActivity("system", null, fixture("job")),
  );
  await expectRejected("user activity without a user is rejected", () =>
    insertActivity("user", null, null),
  );
  await expectRejected("user activity with a system key is rejected", () =>
    insertActivity("user", userId, fixture("job")),
  );
  await expectRejected(
    "system activity without a key is rejected (legacy shape)",
    () => insertActivity("system", null, null),
  );
  await expectRejected("system activity with a user is rejected", () =>
    insertActivity("system", userId, fixture("job")),
  );

  const insertSecurityEvent = (
    actorType: string,
    actorUserId: string | null,
    systemActorKey: string | null,
    type = "workspace_owner_bootstrapped",
    id = randomUUID(),
  ) => sql`
    INSERT INTO security_events (id, type, actor_type, actor_user_id, system_actor_key, subject_type, subject_id,
                                 occurred_at)
    VALUES (${id}, ${type}, ${actorType}, ${actorUserId}, ${systemActorKey}, 'workspace_member',
            ${randomUUID()}, ${now})
  `;

  const securityEventId = randomUUID();
  await expectAccepted("security event by a user is accepted", () =>
    insertSecurityEvent("user", userId, null, undefined, securityEventId),
  );
  await expectRejected(
    "security events cannot be updated",
    () =>
      sql`UPDATE security_events SET occurred_at = NOW() WHERE id = ${securityEventId}`,
  );
  await expectRejected(
    "security events cannot be deleted",
    () => sql`DELETE FROM security_events WHERE id = ${securityEventId}`,
  );
  await expectRejected("security event without an actor is rejected", () =>
    insertSecurityEvent("user", null, null),
  );
  await expectRejected("security event with an unknown type is rejected", () =>
    insertSecurityEvent("user", userId, null, "role_granted_somehow"),
  );
  await expectRejected(
    "security event without occurred_at is rejected",
    () =>
      sql`
      INSERT INTO security_events (id, type, actor_type, actor_user_id, subject_type, subject_id)
      VALUES (${randomUUID()}, 'workspace_owner_bootstrapped', 'user', ${userId}, 'workspace_member', ${randomUUID()})
    `,
  );
}

async function runSecurityEventConstraintChecks(sql: Sql) {
  const rows = (await sql`
    SELECT conname, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'security_events'::regclass
      AND conname IN ('security_events_type_check', 'security_events_subject_type_check')
  `) as { conname: string; definition: string }[];
  const definitions = new Map(rows.map((row) => [row.conname, row.definition]));

  const expectations: [string, readonly string[]][] = [
    ["security_events_type_check", SECURITY_EVENT_TYPE_VALUES],
    ["security_events_subject_type_check", SECURITY_SUBJECT_TYPE_VALUES],
  ];

  for (const [constraintName, expectedValues] of expectations) {
    const definition = definitions.get(constraintName) ?? "";
    const databaseValues = [...definition.matchAll(/'([^']+)'/g)]
      .map((match) => match[1])
      .sort();
    const codeValues = [...expectedValues].sort();
    record(
      `${constraintName} matches the const object`,
      JSON.stringify(databaseValues) === JSON.stringify(codeValues),
      `database: ${databaseValues.join(", ")} | code: ${codeValues.join(", ")}`,
    );
  }
}

// The workspace maps these names to domain errors; a renamed index would silently turn a 409 into a 500.
async function runConstraintNameChecks(sql: Sql) {
  const names = [...AUTH_CONSTRAINT_NAME_VALUES];
  const rows = (await sql`
    SELECT conname AS name
    FROM pg_constraint
    WHERE conname = ANY (${names})
    UNION
    SELECT indexname AS name
    FROM pg_indexes
    WHERE indexname = ANY (${names})
  `) as { name: string }[];
  const existing = new Set(rows.map((row) => row.name));

  for (const name of names) {
    record(`constraint ${name} exists`, existing.has(name));
  }
}

async function cleanup(sql: Sql) {
  const pattern = `${FIXTURE_PREFIX}%`;
  await sql`DELETE FROM leads WHERE display_name LIKE ${pattern}`;
  await sql.query(`
    DO $$
    BEGIN
      PERFORM set_config('invessiv.security_event_maintenance', 'on', true);
      DELETE FROM security_events
      WHERE actor_user_id IN (
        SELECT id FROM users WHERE clerk_user_id LIKE '${FIXTURE_PREFIX}%'
      ) OR system_actor_key LIKE '${FIXTURE_PREFIX}%';
    END
    $$;
  `);
  await sql`
    DELETE FROM workspace_member_roles
    WHERE workspace_member_id IN (
      SELECT wm.id FROM workspace_members AS wm JOIN users AS u ON u.id = wm.user_id
      WHERE u.clerk_user_id LIKE ${pattern}
    )
  `;
  await sql`
    DELETE FROM workspace_members
    WHERE user_id IN (SELECT id FROM users WHERE clerk_user_id LIKE ${pattern})
  `;
  await sql`DELETE FROM roles WHERE name LIKE ${pattern} AND NOT is_system`;
  await sql`DELETE FROM users WHERE clerk_user_id LIKE ${pattern}`;
}

async function run() {
  const target = parseDatabaseTarget(process.argv);

  if (!target || !ALLOWED_TARGETS.includes(target)) {
    throw new Error(
      `The RBAC smoke writes test rows and therefore only runs against ${ALLOWED_TARGETS.join(" or ")}.`,
    );
  }

  configureDatabaseUrlFromTarget(target);

  if (!getDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const sql = getDatabaseClient();
  const db = getDrizzleDatabaseClient();

  try {
    await runCatalogChecks(db);
    await runUserAndMemberChecks(sql);
    await runRoleChecks(sql);
    await runActorChecks(sql);
    await runSecurityEventConstraintChecks(sql);
    await runConstraintNameChecks(sql);
  } finally {
    await cleanup(sql);
  }

  for (const check of checks) {
    const mark = check.ok ? "ok  " : "FAIL";
    const detail = check.detail ? ` — ${check.detail}` : "";
    console.log(`${mark} ${check.name}${detail}`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`${failed.length} of ${checks.length} RBAC checks failed.`);
  }

  console.log(`\nAll ${checks.length} RBAC checks passed.`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
