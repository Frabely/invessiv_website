/**
 * Verifies the invariants of users, roles, permissions and actor references against a real database.
 *
 * Realm separation and delegability must be rejected by Postgres itself, so a mocked unit test cannot
 * prove them. Every row carries a fixture prefix and is removed at the end — even if a check fails.
 */
import { randomUUID } from "node:crypto";
import { getTableConfig } from "drizzle-orm/pg-core";

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
import { PERMISSIONS_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/auth/permissions-constraint-names";
import { ROLE_PERMISSIONS_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/auth/role-permissions-constraint-names";
import { ROLES_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/auth/roles-constraint-names";
import {
  SECURITY_EVENTS_CONSTRAINT_NAME_VALUES,
  SecurityEventsConstraintName,
} from "@invessiv/db/constraint-names/auth/security-events-constraint-names";
import { USERS_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/auth/users-constraint-names";
import { WORKSPACE_MEMBER_ROLES_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/auth/workspace-member-roles-constraint-names";
import { WORKSPACE_MEMBERS_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/crm/workspace-members-constraint-names";
import { PORTAL_INVITATION_ROLES_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/auth/portal-invitation-roles-constraint-names";
import { PORTAL_MEMBERSHIP_ROLES_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/auth/portal-membership-roles-constraint-names";
import { PORTAL_INVITATIONS_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/crm/portal-invitations-constraint-names";
import { PORTAL_MEMBERSHIPS_CONSTRAINT_NAME_VALUES } from "@invessiv/db/constraint-names/crm/portal-memberships-constraint-names";
import { securityEvents } from "@invessiv/db/record-configuration";
import {
  findMissingConstraintNames,
  hasSameValues,
  readCheckConstraintValues,
} from "./constraint-catalog";
import {
  configureDatabaseUrlFromTarget,
  type DatabaseTarget,
  parseDatabaseTarget,
} from "./database-target";
import { findRbacCatalogMismatches } from "./rbac-catalog-check";

const FIXTURE_PREFIX = "smoke:rbac:";
const ALLOWED_TARGETS: DatabaseTarget[] = [
  "development",
  "preview",
  "production",
];

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
    INSERT INTO roles (id, realm, system_key, name, is_system, active, scope_assignable, version)
    VALUES (${id}, ${args.realm}, NULL, ${args.name}, FALSE, TRUE, FALSE, 1)
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
        INSERT INTO roles (id, realm, system_key, name, is_system, active, scope_assignable, version)
        VALUES (${randomUUID()}, 'workspace', 'workspace_owner', ${fixture("Fake owner")}, FALSE, TRUE, FALSE, 1)
    `,
  );
  await expectRejected(
    "system role without a system key is rejected",
    () =>
      sql`
        INSERT INTO roles (id, realm, system_key, name, is_system, active, scope_assignable, version)
        VALUES (${randomUUID()}, 'workspace', NULL, ${fixture("Fake system")}, TRUE, TRUE, FALSE, 1)
    `,
  );
  await expectRejected(
    "role without active flag is rejected",
    () =>
      sql`
        INSERT INTO roles (id, realm, name, is_system, scope_assignable, version)
        VALUES (${randomUUID()}, 'workspace', ${fixture("No active")}, FALSE, FALSE, 1)
    `,
  );

  await expectAccepted(
    "custom role can hold a delegable permission",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                                    permission_delegable, permission_scope_assignable)
      VALUES (${customRoleId}, 'workspace', FALSE, FALSE, ${Permission.LeadsRead}, TRUE, FALSE)
    `,
  );
  await expectRejected(
    "custom role cannot hold a non-delegable permission (flag spoofed)",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                                    permission_delegable, permission_scope_assignable)
      VALUES (${customRoleId}, 'workspace', FALSE, FALSE, ${Permission.RolesManage}, TRUE, FALSE)
    `,
  );
  await expectRejected(
    "custom role cannot hold a non-delegable permission (flag honest)",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                                    permission_delegable, permission_scope_assignable)
      VALUES (${customRoleId}, 'workspace', FALSE, FALSE, ${Permission.MembersManage}, FALSE, FALSE)
    `,
  );
  await expectRejected(
    "custom role cannot claim to be a system role",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                                    permission_delegable, permission_scope_assignable)
      VALUES (${customRoleId}, 'workspace', TRUE, FALSE, ${Permission.DataPurge}, FALSE, FALSE)
    `,
  );
  await expectRejected(
    "portal role cannot hold a workspace permission (realm of role)",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                                    permission_delegable, permission_scope_assignable)
      VALUES (${portalRoleId}, 'portal', FALSE, FALSE, ${Permission.LeadsRead}, TRUE, FALSE)
    `,
  );
  await expectRejected(
    "portal role cannot hold a workspace permission (realm of permission)",
    () => sql`
      INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                                    permission_delegable, permission_scope_assignable)
      VALUES (${portalRoleId}, 'workspace', FALSE, FALSE, ${Permission.LeadsRead}, TRUE, FALSE)
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
  const checkValues = await readCheckConstraintValues(
    sql,
    getTableConfig(securityEvents).name,
  );
  const expectations: [SecurityEventsConstraintName, readonly string[]][] = [
    [SecurityEventsConstraintName.TypeCheck, SECURITY_EVENT_TYPE_VALUES],
    [
      SecurityEventsConstraintName.SubjectTypeCheck,
      SECURITY_SUBJECT_TYPE_VALUES,
    ],
  ];

  for (const [constraintName, expectedValues] of expectations) {
    const databaseValues = checkValues.get(constraintName) ?? [];
    record(
      `${constraintName} matches the const object`,
      hasSameValues(databaseValues, expectedValues),
      `database: ${databaseValues.join(", ")} | code: ${[...expectedValues].sort().join(", ")}`,
    );
  }
}

async function runScopeAssignableNullabilityChecks(sql: Sql) {
  const expected = [
    "permissions.scope_assignable",
    "roles.scope_assignable",
    "role_permissions.role_scope_assignable",
    "role_permissions.permission_scope_assignable",
  ];
  const columns = (await sql`
    SELECT table_name, column_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND (table_name, column_name) IN (
                                        ('permissions', 'scope_assignable'),
                                        ('roles', 'scope_assignable'),
                                        ('role_permissions', 'role_scope_assignable'),
                                        ('role_permissions', 'permission_scope_assignable')
      )
  `) as {
    table_name: string;
    column_name: string;
    is_nullable: "YES" | "NO";
  }[];
  const notNullColumns = new Set(
    columns
      .filter((column) => column.is_nullable === "NO")
      .map((column) => `${column.table_name}.${column.column_name}`),
  );

  for (const column of expected) {
    record(`${column} is NOT NULL`, notNullColumns.has(column));
  }
}

const AUTH_CONSTRAINT_NAMES = [
  ...USERS_CONSTRAINT_NAME_VALUES,
  ...ROLES_CONSTRAINT_NAME_VALUES,
  ...PERMISSIONS_CONSTRAINT_NAME_VALUES,
  ...ROLE_PERMISSIONS_CONSTRAINT_NAME_VALUES,
  ...WORKSPACE_MEMBER_ROLES_CONSTRAINT_NAME_VALUES,
  ...WORKSPACE_MEMBERS_CONSTRAINT_NAME_VALUES,
  ...SECURITY_EVENTS_CONSTRAINT_NAME_VALUES,
  ...PORTAL_MEMBERSHIPS_CONSTRAINT_NAME_VALUES,
  ...PORTAL_INVITATIONS_CONSTRAINT_NAME_VALUES,
  ...PORTAL_MEMBERSHIP_ROLES_CONSTRAINT_NAME_VALUES,
  ...PORTAL_INVITATION_ROLES_CONSTRAINT_NAME_VALUES,
];

// Models, error mapping and smokes share these names; a renamed index would silently turn a 409 into a 500.
/**
 * The same realm-pinning mechanism as `workspace_member_roles` (role_realm CHECK plus a
 * composite foreign key to `roles(id, realm)`), applied to the two portal junction tables. A
 * mocked test cannot prove Postgres itself rejects the wrong realm.
 */
async function runPortalRealmChecks(sql: Sql) {
  const actorUserId = await insertUser(sql);
  const memberId = await insertMember(sql, actorUserId);
  const portalUserId = await insertUser(sql);

  const customerId = randomUUID();
  await sql`
    INSERT INTO customers (id, display_name, status, owner_member_id, version)
    VALUES (${customerId}, ${fixture(customerId)}, 'active', ${memberId}, 1)
  `;
  const personId = randomUUID();
  await sql`
    INSERT INTO people (id, display_name, preferred_locale, version)
    VALUES (${personId}, ${fixture("Portal contact")}, 'de', 1)
  `;
  const assignmentId = randomUUID();
  await sql`
    INSERT INTO customer_contact_assignments (id, customer_id, person_id, is_primary, version)
    VALUES (${assignmentId}, ${customerId}, ${personId}, TRUE, 1)
  `;
  const membershipId = randomUUID();
  await sql`
    INSERT INTO portal_memberships
    (id, customer_id, person_id, user_id, activated_at, email_notifications_enabled, version)
    VALUES (${membershipId}, ${customerId}, ${personId}, ${portalUserId}, NOW(), TRUE, 1)
  `;

  const portalRoleId = await insertRole(sql, {
    realm: "portal",
    name: fixture("Portal role for junction check"),
  });
  const workspaceRoleId = await insertRole(sql, {
    realm: "workspace",
    name: fixture("Workspace role for junction check"),
  });
  const assignedAt = new Date();

  await expectAccepted(
    "a portal role can be assigned to a portal membership",
    () => sql`
        INSERT INTO portal_membership_roles (portal_membership_id, role_id, role_realm, assigned_by_member_id,
                                             assigned_at)
        VALUES (${membershipId}, ${portalRoleId}, 'portal', ${memberId}, ${assignedAt})
      `,
  );
  await expectRejected(
    "a workspace role cannot be assigned to a portal membership (realm spoofed)",
    () => sql`
        INSERT INTO portal_membership_roles (portal_membership_id, role_id, role_realm, assigned_by_member_id,
                                             assigned_at)
        VALUES (${membershipId}, ${workspaceRoleId}, 'portal', ${memberId}, ${assignedAt})
      `,
  );
  await expectRejected(
    "a workspace role cannot be assigned to a portal membership (realm honest)",
    () => sql`
        INSERT INTO portal_membership_roles (portal_membership_id, role_id, role_realm, assigned_by_member_id,
                                             assigned_at)
        VALUES (${membershipId}, ${workspaceRoleId}, 'workspace', ${memberId}, ${assignedAt})
      `,
  );

  const invitationId = randomUUID();
  await sql`
    INSERT INTO portal_invitations
    (id, assignment_id, token_hash, email_notifications_enabled, expires_at, created_by_member_id)
    VALUES (${invitationId}, ${assignmentId}, ${fixture("invite-token")}, TRUE, NOW() + INTERVAL '7 days',
            ${memberId})
  `;
  await expectAccepted(
    "a portal role can be attached to an invitation",
    () => sql`
        INSERT INTO portal_invitation_roles (portal_invitation_id, role_id, role_realm)
        VALUES (${invitationId}, ${portalRoleId}, 'portal')
      `,
  );
  await expectRejected(
    "a workspace role cannot be attached to an invitation (realm honest)",
    () => sql`
        INSERT INTO portal_invitation_roles (portal_invitation_id, role_id, role_realm)
        VALUES (${invitationId}, ${workspaceRoleId}, 'workspace')
      `,
  );
}

async function runConstraintNameChecks(sql: Sql) {
  const missing = new Set(
    await findMissingConstraintNames(sql, AUTH_CONSTRAINT_NAMES),
  );

  for (const name of AUTH_CONSTRAINT_NAMES) {
    record(`constraint ${name} exists`, !missing.has(name));
  }
}

async function cleanup(sql: Sql) {
  const pattern = `${FIXTURE_PREFIX}%`;
  // customers.owner_member_id has no ON DELETE action, so the customer (and, cascading through
  // it, the contact assignment, portal membership/invitation and their role rows) must go before
  // the workspace_members delete further down.
  await sql`
    DELETE
    FROM customer_contact_assignments
    WHERE customer_id IN (SELECT id FROM customers WHERE display_name LIKE ${pattern})
       OR person_id IN (SELECT id FROM people WHERE display_name LIKE ${pattern})
  `;
  await sql`DELETE
            FROM customers
            WHERE display_name LIKE ${pattern}`;
  await sql`DELETE
            FROM people
            WHERE display_name LIKE ${pattern}`;
  // Deleting the fixture lead first would null its activities' only subject via
  // ON DELETE SET NULL and trip activities_subject_check; the activity goes first.
  await sql`
    DELETE
    FROM activities
    WHERE lead_id IN (SELECT id FROM leads WHERE display_name LIKE ${pattern})
  `;
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
    await runScopeAssignableNullabilityChecks(sql);
    await runPortalRealmChecks(sql);
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
