import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, eq, inArray, like, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  rolePermissions,
  roles,
  securityEvents,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { BootstrapWorkspaceOwnerError } from "@/common/constants/auth/bootstrap-workspace-owner-errors";
import { WorkspaceActorResolutionError } from "@/common/constants/auth/workspace-actor-resolution-errors";
import { GET, POST } from "@/app/api/workspace/leads/route";
import { bootstrapWorkspaceOwner } from "@/server/workspace/auth/command-handler/bootstrap-workspace-owner.command-handler";
import { resolveWorkspaceActor } from "@/server/workspace/auth/query-handler/resolve-workspace-actor.query-handler";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockListLeads, mockCreateLead } = vi.hoisted(
  () => ({
    mockAuth: vi.fn(),
    mockCurrentUser: vi.fn(),
    mockListLeads: vi.fn(),
    mockCreateLead: vi.fn(),
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));
vi.mock(
  "@/server/workspace/leads/query-handler/list-leads.query-handler",
  () => ({ listLeads: mockListLeads }),
);
vi.mock(
  "@/server/workspace/leads/command-handler/create-lead.command-handler",
  () => ({ createLead: mockCreateLead }),
);

const RUN_INTEGRATION = process.env.RBAC_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:rbac:";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "workspace authorization PostgreSQL integration",
  () => {
    let db: Database;

    async function createUser(options: { active?: boolean } = {}) {
      const id = randomUUID();
      const clerkUserId = `${FIXTURE_PREFIX}${id}`;
      await db.insert(users).values({
        id,
        clerk_user_id: clerkUserId,
        primary_email: `${FIXTURE_PREFIX}${id}@example.test`,
        display_name: `${FIXTURE_PREFIX}user`,
        active: options.active ?? true,
        version: 1,
      });
      return { id, clerkUserId };
    }

    async function createMember(
      userId: string,
      options: { active?: boolean } = {},
    ) {
      const id = randomUUID();
      await db.insert(workspaceMembers).values({
        id,
        user_id: userId,
        active: options.active ?? true,
        version: 1,
      });
      return id;
    }

    async function createCustomRole(
      permissions: Permission[],
      options: { active?: boolean } = {},
    ) {
      const id = randomUUID();
      await db.insert(roles).values({
        id,
        realm: AuthRealm.Workspace,
        system_key: null,
        name: `${FIXTURE_PREFIX}${id}`,
        description: null,
        is_system: false,
        active: options.active ?? true,
        scope_assignable: false,
        version: 1,
      });
      if (permissions.length > 0) {
        await db.insert(rolePermissions).values(
          permissions.map((permission) => ({
            role_id: id,
            realm: AuthRealm.Workspace,
            role_is_system: false,
            role_scope_assignable: false,
            permission_key: permission,
            permission_delegable: PERMISSION_DEFINITIONS[permission].delegable,
            permission_scope_assignable:
              PERMISSION_DEFINITIONS[permission].scopeAssignable,
          })),
        );
      }
      return id;
    }

    async function assignRole(memberId: string, roleId: string, by: string) {
      await db.insert(workspaceMemberRoles).values({
        workspace_member_id: memberId,
        role_id: roleId,
        role_realm: AuthRealm.Workspace,
        assigned_by_user_id: by,
        assigned_at: new Date(),
      });
    }

    async function createActor(permissions: Permission[]) {
      const user = await createUser();
      const memberId = await createMember(user.id);
      const roleId = await createCustomRole(permissions);
      await assignRole(memberId, roleId, user.id);
      return { ...user, memberId, roleId };
    }

    async function activeOwnerExists() {
      const rows = await db
        .select({ memberId: workspaceMemberRoles.workspace_member_id })
        .from(workspaceMemberRoles)
        .innerJoin(roles, eq(roles.id, workspaceMemberRoles.role_id))
        .innerJoin(
          workspaceMembers,
          eq(workspaceMembers.id, workspaceMemberRoles.workspace_member_id),
        )
        .innerJoin(users, eq(users.id, workspaceMembers.user_id))
        .where(
          and(
            eq(roles.system_key, SystemRoleKey.WorkspaceOwner),
            eq(roles.active, true),
            eq(workspaceMembers.active, true),
            eq(users.active, true),
          ),
        )
        .limit(1);
      return rows.length > 0;
    }

    function leadsRequest(init?: RequestInit) {
      return new Request(
        "http://localhost/api/workspace/leads",
        init,
      ) as unknown as NextRequest;
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
          "Development database URL is not configured for the RBAC integration test.",
        );
      }

      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();
    }, 30_000);

    afterEach(() => {
      vi.unstubAllEnvs();
      mockAuth.mockReset();
      mockListLeads.mockReset();
      mockCreateLead.mockReset();
    });

    afterAll(async () => {
      if (!db) return;
      const pattern = `${FIXTURE_PREFIX}%`;
      const fixtureUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(like(users.clerk_user_id, pattern));
      const userIds = fixtureUsers.map((row) => row.id);

      if (userIds.length > 0) {
        const fixtureMembers = await db
          .select({ id: workspaceMembers.id })
          .from(workspaceMembers)
          .where(inArray(workspaceMembers.user_id, userIds));
        const memberIds = fixtureMembers.map((row) => row.id);

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
            .where(
              inArray(workspaceMemberRoles.workspace_member_id, memberIds),
            );
          await db
            .delete(workspaceMembers)
            .where(inArray(workspaceMembers.id, memberIds));
        }
      }

      await db.delete(roles).where(like(roles.name, pattern));
      if (userIds.length > 0) {
        await db.delete(users).where(inArray(users.id, userIds));
      }
    }, 30_000);

    describe("resolveWorkspaceActor", () => {
      it("resolves the union of all active role permissions", async () => {
        const actor = await createActor([Permission.LeadsRead]);
        const secondRole = await createCustomRole([
          Permission.LeadsRead,
          Permission.LeadsWrite,
        ]);
        await assignRole(actor.memberId, secondRole, actor.id);

        const result = await resolveWorkspaceActor(actor.clerkUserId);

        expect(result).toEqual({
          ok: true,
          actor: {
            userId: actor.id,
            workspaceMemberId: actor.memberId,
            permissions: new Set([Permission.LeadsRead, Permission.LeadsWrite]),
          },
        });
      }, 30_000);

      it("ignores permissions of an inactive role", async () => {
        const actor = await createActor([Permission.LeadsRead]);
        const inactiveRole = await createCustomRole([Permission.LeadsDelete], {
          active: false,
        });
        await assignRole(actor.memberId, inactiveRole, actor.id);

        const result = await resolveWorkspaceActor(actor.clerkUserId);

        expect(result.ok && [...result.actor.permissions]).toEqual([
          Permission.LeadsRead,
        ]);
      }, 30_000);

      it("applies a revoked role on the next resolution", async () => {
        const actor = await createActor([Permission.LeadsRead]);
        expect((await resolveWorkspaceActor(actor.clerkUserId)).ok).toBe(true);

        await db
          .delete(workspaceMemberRoles)
          .where(eq(workspaceMemberRoles.workspace_member_id, actor.memberId));

        const result = await resolveWorkspaceActor(actor.clerkUserId);
        expect(result.ok && result.actor.permissions.size).toBe(0);
      }, 30_000);

      it("keeps identity and rights when the email address changes", async () => {
        const actor = await createActor([Permission.DashboardRead]);

        await db
          .update(users)
          .set({ primary_email: `${FIXTURE_PREFIX}changed@example.test` })
          .where(eq(users.id, actor.id));

        const result = await resolveWorkspaceActor(actor.clerkUserId);
        expect(result).toMatchObject({
          ok: true,
          actor: { userId: actor.id },
        });
        expect(result.ok && [...result.actor.permissions]).toEqual([
          Permission.DashboardRead,
        ]);
      }, 30_000);

      it("rejects incomplete or inactive identities", async () => {
        const inactiveUser = await createUser({ active: false });
        await createMember(inactiveUser.id);
        const userWithoutMembership = await createUser();
        const inactiveMember = await createUser();
        await createMember(inactiveMember.id, { active: false });

        await expect(
          resolveWorkspaceActor(`${FIXTURE_PREFIX}unknown`),
        ).resolves.toEqual({
          ok: false,
          code: WorkspaceActorResolutionError.UserMissing,
        });
        await expect(
          resolveWorkspaceActor(inactiveUser.clerkUserId),
        ).resolves.toEqual({
          ok: false,
          code: WorkspaceActorResolutionError.UserInactive,
        });
        await expect(
          resolveWorkspaceActor(userWithoutMembership.clerkUserId),
        ).resolves.toEqual({
          ok: false,
          code: WorkspaceActorResolutionError.MembershipMissing,
        });
        await expect(
          resolveWorkspaceActor(inactiveMember.clerkUserId),
        ).resolves.toEqual({
          ok: false,
          code: WorkspaceActorResolutionError.MembershipInactive,
        });
      }, 30_000);
    });

    describe("leads route with real authorization", () => {
      it("allows the permitted action, forbids the other and applies revocation on the next request", async () => {
        const actor = await createActor([Permission.LeadsRead]);
        mockAuth.mockResolvedValue({ userId: actor.clerkUserId });
        mockListLeads.mockResolvedValue({
          rows: [],
          total: 0,
          page: 1,
          perPage: 25,
        });

        expect((await GET(leadsRequest())).status).toBe(200);

        const postResponse = await POST(
          leadsRequest({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ displayName: "X Example", last_name: "X" }),
          }),
        );
        expect(postResponse.status).toBe(403);
        expect(mockCreateLead).not.toHaveBeenCalled();

        await db
          .delete(workspaceMemberRoles)
          .where(eq(workspaceMemberRoles.workspace_member_id, actor.memberId));

        expect((await GET(leadsRequest())).status).toBe(403);
      }, 30_000);

      it("answers 404 for a signed-in account without membership", async () => {
        const user = await createUser();
        mockAuth.mockResolvedValue({ userId: user.clerkUserId });

        expect((await GET(leadsRequest())).status).toBe(404);
        expect(mockListLeads).not.toHaveBeenCalled();
      }, 30_000);
    });

    describe("owner bootstrap", () => {
      function bootstrapInput(clerkUserId: string) {
        return {
          clerkUserId,
          primaryEmail: `${clerkUserId}@example.test`,
          firstName: null,
          lastName: null,
          displayName: `${FIXTURE_PREFIX}owner`,
        };
      }

      it("creates exactly one owner from parallel requests and closes afterwards", async (context) => {
        // A developer who already bootstrapped on this database closes the path the test needs.
        if (await activeOwnerExists()) {
          context.skip(
            "An active owner exists; the bootstrap race needs a database without one.",
          );
          return;
        }
        const clerkUserId = `${FIXTURE_PREFIX}${randomUUID()}`;
        vi.stubEnv("WORKSPACE_BOOTSTRAP_CLERK_USER_ID", clerkUserId);

        const [first, second] = await Promise.all([
          bootstrapWorkspaceOwner(bootstrapInput(clerkUserId)),
          bootstrapWorkspaceOwner(bootstrapInput(clerkUserId)),
        ]);
        const winners = [first, second].filter((result) => result.ok);

        expect(winners).toHaveLength(1);
        for (const result of [first, second].filter((entry) => !entry.ok)) {
          expect(result).toEqual({
            ok: false,
            code: BootstrapWorkspaceOwnerError.AlreadyInitialized,
          });
        }

        const winner = winners[0];
        if (winner?.ok) {
          const events = await db
            .select({ id: securityEvents.id })
            .from(securityEvents)
            .where(eq(securityEvents.subject_id, winner.workspaceMemberId));
          expect(events).toHaveLength(1);
        }

        await expect(
          bootstrapWorkspaceOwner(bootstrapInput(clerkUserId)),
        ).resolves.toEqual({
          ok: false,
          code: BootstrapWorkspaceOwnerError.AlreadyInitialized,
        });
      }, 60_000);
    });
  },
);
