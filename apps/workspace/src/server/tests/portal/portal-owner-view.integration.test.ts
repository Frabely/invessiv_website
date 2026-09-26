import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, eq, inArray, like, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { PORTAL_READ_PERMISSION_VALUES } from "@invessiv/common/constants/auth/permission-definitions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customers,
  securityEvents,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { resolvePortalOwnerView } from "@/server/portal/auth/resolve-portal-owner-view";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.RBAC_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:portal-owner-view:";
const OWNER_ROLE_ID = SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceOwner].id;

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "portal owner view PostgreSQL integration",
  () => {
    let db: Database;
    let customerId: string;

    async function createIdentity(options: {
      userActive?: boolean;
      memberActive?: boolean;
      owner: boolean;
    }) {
      const userId = randomUUID();
      const clerkUserId = `${FIXTURE_PREFIX}${userId}`;
      await db.insert(users).values({
        id: userId,
        clerk_user_id: clerkUserId,
        primary_email: `${FIXTURE_PREFIX}${userId}@example.test`,
        display_name: `${FIXTURE_PREFIX}user`,
        active: options.userActive ?? true,
        version: 1,
      });
      const memberId = randomUUID();
      await db.insert(workspaceMembers).values({
        id: memberId,
        user_id: userId,
        active: options.memberActive ?? true,
        version: 1,
      });
      if (options.owner) {
        await db.insert(workspaceMemberRoles).values({
          workspace_member_id: memberId,
          role_id: OWNER_ROLE_ID,
          role_realm: AuthRealm.Workspace,
          assigned_by_user_id: userId,
          assigned_at: new Date(),
        });
      }
      return { userId, clerkUserId };
    }

    beforeAll(async () => {
      const workspaceRoot = findWorkspaceRoot(process.cwd());
      const loaded = loadDotenv({
        path: path.join(workspaceRoot, ".env.development.local"),
        quiet: true,
      });
      const databaseUrl =
        process.env.DATABASE_URL_DEVELOPMENT?.trim() ||
        loaded.parsed?.DATABASE_URL?.trim();
      if (!databaseUrl) {
        throw new Error(
          "Development database URL is not configured for the portal owner view integration test.",
        );
      }
      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();

      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .limit(1);
      if (!customer) {
        throw new Error("Seed at least one customer (db:seed:crm) first.");
      }
      customerId = customer.id;
    }, 30_000);

    afterAll(async () => {
      if (!db) return;
      const fixtureUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(like(users.clerk_user_id, `${FIXTURE_PREFIX}%`));
      const userIds = fixtureUsers.map((row) => row.id);
      if (userIds.length === 0) return;

      const memberIds = (
        await db
          .select({ id: workspaceMembers.id })
          .from(workspaceMembers)
          .where(inArray(workspaceMembers.user_id, userIds))
      ).map((row) => row.id);

      await db.transaction(async (tx) => {
        await tx.execute(
          sql`select set_config('invessiv.security_event_maintenance', 'on', true)`,
        );
        await tx
          .delete(securityEvents)
          .where(inArray(securityEvents.actor_user_id, userIds));
      });
      if (memberIds.length > 0) {
        await db
          .delete(workspaceMemberRoles)
          .where(inArray(workspaceMemberRoles.workspace_member_id, memberIds));
        await db
          .delete(workspaceMembers)
          .where(inArray(workspaceMembers.id, memberIds));
      }
      await db.delete(users).where(inArray(users.id, userIds));
    }, 30_000);

    it("opens a read-only view for an active owner and records exactly one event", async () => {
      const owner = await createIdentity({ owner: true });

      const view = await resolvePortalOwnerView(owner.clerkUserId, customerId);

      expect(view).toMatchObject({ userId: owner.userId, customerId });
      expect([...view!.permissions]).toEqual([
        ...PORTAL_READ_PERMISSION_VALUES,
      ]);
      const events = await db
        .select({
          subjectType: securityEvents.subject_type,
          metadata: securityEvents.metadata,
        })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.type, SecurityEventType.PortalOwnerViewOpened),
            eq(securityEvents.actor_user_id, owner.userId),
            eq(securityEvents.subject_id, customerId),
          ),
        );
      expect(events).toEqual([
        { subjectType: SecuritySubjectType.Customer, metadata: null },
      ]);
    });

    it.each([
      ["a member without the owner role", { owner: false }],
      [
        "an owner with an inactive membership",
        { owner: true, memberActive: false },
      ],
      ["an owner with an inactive user", { owner: true, userActive: false }],
    ])("returns null for %s", async (_label, options) => {
      const identity = await createIdentity(options);

      await expect(
        resolvePortalOwnerView(identity.clerkUserId, customerId),
      ).resolves.toBeNull();
    });

    it("returns null for an unknown customer and writes no event", async () => {
      const owner = await createIdentity({ owner: true });

      await expect(
        resolvePortalOwnerView(owner.clerkUserId, randomUUID()),
      ).resolves.toBeNull();
      const events = await db
        .select({ id: securityEvents.id })
        .from(securityEvents)
        .where(eq(securityEvents.actor_user_id, owner.userId));
      expect(events).toHaveLength(0);
    });
  },
);
