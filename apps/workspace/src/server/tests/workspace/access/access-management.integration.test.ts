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
import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import {
  Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CreateRoleRequestDto } from "@invessiv/common/contracts/auth/create-role-request.dto";
import {
  findWorkspaceRoot,
  getDrizzleDatabaseClient,
  PostgresErrorCode,
} from "@invessiv/db/core";
import {
  roles,
  securityEvents,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { GET, POST } from "@/app/api/workspace/leads/route";
import { addWorkspaceMember } from "@/server/workspace/access/command-handler/add-workspace-member.command-handler";
import { createRole } from "@/server/workspace/access/command-handler/create-role.command-handler";
import { replaceWorkspaceMemberRoles } from "@/server/workspace/access/command-handler/replace-workspace-member-roles.command-handler";
import { roleAssignmentService } from "@/server/workspace/access/services/role-assignment-service";
import { workspaceOwnerInvariantService } from "@/server/workspace/auth/services/workspace-owner-invariant-service";

vi.mock("server-only", () => ({}));

const {
  mockAuth,
  mockCurrentUser,
  mockListLeads,
  mockCreateLead,
  mockFindProfile,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
  mockListLeads: vi.fn(),
  mockCreateLead: vi.fn(),
  mockFindProfile: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
  clerkClient: vi.fn(),
}));
vi.mock(
  "@/server/workspace/leads/query-handler/list-leads.query-handler",
  () => ({ listLeads: mockListLeads }),
);
vi.mock(
  "@/server/workspace/leads/command-handler/create-lead.command-handler",
  () => ({ createLead: mockCreateLead }),
);
vi.mock("@/server/workspace/access/services/clerk-directory-service", () => ({
  clerkDirectoryService: {
    findProfile: mockFindProfile,
    listCandidateProfiles: vi.fn(),
    listProfilesByIds: vi.fn(),
  },
}));

const RUN_INTEGRATION = process.env.RBAC_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:access:";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

function hasErrorCode(error: unknown, expectedCode: string): boolean {
  const visited = new WeakSet<object>();
  const pending: unknown[] = [error];
  while (pending.length > 0) {
    const current = pending.pop();
    if (
      typeof current !== "object" ||
      current === null ||
      visited.has(current)
    ) {
      continue;
    }
    visited.add(current);
    if ((current as { code?: unknown }).code === expectedCode) {
      return true;
    }
    for (const key of ["cause", "originalError", "originalCause"] as const) {
      if (key in current) {
        pending.push((current as Record<string, unknown>)[key]);
      }
    }
  }
  return false;
}

describe.skipIf(!RUN_INTEGRATION)(
  "access management PostgreSQL integration",
  () => {
    let db: Database;

    async function createOwner({
      memberActive = true,
      userActive = true,
    }: { memberActive?: boolean; userActive?: boolean } = {}) {
      const userId = randomUUID();
      const memberId = randomUUID();
      const now = new Date();
      await db.insert(users).values({
        id: userId,
        clerk_user_id: `${FIXTURE_PREFIX}${userId}`,
        primary_email: `${FIXTURE_PREFIX}${userId}@example.test`,
        display_name: `${FIXTURE_PREFIX}owner`,
        active: userActive,
        version: 1,
      });
      await db.insert(workspaceMembers).values({
        id: memberId,
        user_id: userId,
        active: memberActive,
        version: 1,
      });
      await db.insert(workspaceMemberRoles).values(
        [SystemRoleKey.WorkspaceOwner, SystemRoleKey.WorkspaceMember].map(
          (key) => ({
            workspace_member_id: memberId,
            role_id: SYSTEM_ROLE_DEFINITIONS[key].id,
            role_realm: AuthRealm.Workspace,
            assigned_by_user_id: userId,
            assigned_at: now,
          }),
        ),
      );
      const actor: WorkspaceActor = {
        userId,
        workspaceMemberId: memberId,
        permissions: new Set(PERMISSION_VALUES),
      };
      return { userId, memberId, actor };
    }

    async function createCustomRole(
      actor: WorkspaceActor,
      permissions: Permission[],
    ) {
      const result = await createRole(
        {
          name: `${FIXTURE_PREFIX}${randomUUID()}`,
          description: null,
          permissions,
        },
        actor,
      );
      if (!result.ok) {
        throw new Error(`Fixture role could not be created: ${result.code}`);
      }
      return result.role;
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
          "Development database URL is not configured for the access integration test.",
        );
      }

      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();
    }, 30_000);

    afterEach(() => {
      mockAuth.mockReset();
      mockListLeads.mockReset();
      mockCreateLead.mockReset();
      mockFindProfile.mockReset();
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

    it("lets a custom role use its action, forbids the other and applies a role change on the next request", async () => {
      const owner = await createOwner();
      const readRole = await createCustomRole(owner.actor, [
        Permission.LeadsRead,
      ]);
      const dashboardRole = await createCustomRole(owner.actor, [
        Permission.DashboardRead,
      ]);
      const clerkUserId = `${FIXTURE_PREFIX}${randomUUID()}`;
      mockFindProfile.mockResolvedValue({
        ok: true,
        profile: {
          clerkUserId,
          primaryEmail: `${clerkUserId}@example.test`,
          firstName: null,
          lastName: null,
          displayName: `${FIXTURE_PREFIX}member`,
        },
      });

      const added = await addWorkspaceMember(
        { clerkUserId, roleIds: [readRole.id] },
        owner.actor,
      );
      if (!added.ok) {
        throw new Error(`Member could not be added: ${added.code}`);
      }

      mockAuth.mockResolvedValue({ userId: clerkUserId });
      mockListLeads.mockResolvedValue({
        rows: [],
        total: 0,
        page: 1,
        perPage: 25,
      });

      expect((await GET(leadsRequest())).status).toBe(200);
      expect(
        (await POST(leadsRequest({ method: "POST", body: "{}" }))).status,
      ).toBe(403);
      expect(mockCreateLead).not.toHaveBeenCalled();

      const replaced = await replaceWorkspaceMemberRoles(
        added.member.id,
        { roleIds: [dashboardRole.id], version: added.member.version },
        owner.actor,
      );
      expect(replaced.ok).toBe(true);
      expect((await GET(leadsRequest())).status).toBe(403);

      const events = await db
        .select({ actorUserId: securityEvents.actor_user_id })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.subject_id, added.member.id),
            eq(
              securityEvents.type,
              SecurityEventType.WorkspaceMemberRolesChanged,
            ),
          ),
        );
      expect(events).toEqual([{ actorUserId: owner.userId }]);
    }, 60_000);

    it("answers a stale member version with the current state and writes nothing", async () => {
      const owner = await createOwner();
      const firstRole = await createCustomRole(owner.actor, [
        Permission.LeadsRead,
      ]);
      const secondRole = await createCustomRole(owner.actor, [
        Permission.DashboardRead,
      ]);

      const first = await replaceWorkspaceMemberRoles(
        owner.memberId,
        { roleIds: [firstRole.id], version: 1 },
        owner.actor,
      );
      expect(first.ok).toBe(true);

      const stale = await replaceWorkspaceMemberRoles(
        owner.memberId,
        { roleIds: [secondRole.id], version: 1 },
        owner.actor,
      );

      expect(stale.ok).toBe(false);
      if (stale.ok || stale.code !== ConcurrencyErrorCode.VersionConflict) {
        throw new Error("Expected a version conflict");
      }
      expect(stale.conflict.currentVersion).toBe(2);
      expect(stale.conflict.current.roles.map((role) => role.id)).toEqual([
        firstRole.id,
      ]);
    }, 60_000);

    it("rejects a non-delegable permission even when the request claims it is delegable", async () => {
      const owner = await createOwner();
      const name = `${FIXTURE_PREFIX}${randomUUID()}`;

      const result = await createRole(
        {
          name,
          description: null,
          permissions: [Permission.MembersManage],
          delegable: true,
        } as CreateRoleRequestDto,
        owner.actor,
      );

      expect(result).toEqual({
        ok: false,
        code: RoleErrorCode.PermissionNotDelegable,
      });
      const stored = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, name));
      expect(stored).toEqual([]);
    }, 30_000);

    it("counts an owner only while membership and user are both active", async () => {
      const activeOwner = await createOwner();
      const inactiveMemberOwner = await createOwner({ memberActive: false });
      const inactiveUserOwner = await createOwner({ userActive: false });

      // Other owners may exist in the shared dev database, so only inclusion is asserted.
      const activeOwnerIds = await db.transaction((tx) =>
        workspaceOwnerInvariantService.findActiveOwnerMemberIds(tx),
      );

      expect(activeOwnerIds).toContain(activeOwner.memberId);
      expect(activeOwnerIds).not.toContain(inactiveMemberOwner.memberId);
      expect(activeOwnerIds).not.toContain(inactiveUserOwner.memberId);
    }, 30_000);

    it("serializes concurrent writes to every owner assignment", async () => {
      const owner = await createOwner();
      let releaseLock: () => void = () => undefined;
      let reportLocked: () => void = () => undefined;
      const holdLock = new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
      const locked = new Promise<void>((resolve) => {
        reportLocked = resolve;
      });

      const lockingTransaction = db.transaction(async (tx) => {
        await workspaceOwnerInvariantService.lockOwnerAssignmentsAndFindActiveOwners(
          tx,
        );
        reportLocked();
        await holdLock;
      });

      await locked;
      let concurrentWriteWasBlocked = false;
      try {
        await db.transaction(async (tx) => {
          await tx.execute(sql`set local lock_timeout = '250ms'`);
          await tx
            .delete(workspaceMemberRoles)
            .where(
              and(
                eq(workspaceMemberRoles.workspace_member_id, owner.memberId),
                eq(
                  workspaceMemberRoles.role_id,
                  workspaceOwnerInvariantService.ownerRoleId,
                ),
              ),
            );
        });
      } catch (error: unknown) {
        concurrentWriteWasBlocked = hasErrorCode(
          error,
          PostgresErrorCode.LockNotAvailable,
        );
      } finally {
        releaseLock();
        await lockingTransaction;
      }

      expect(concurrentWriteWasBlocked).toBe(true);
    }, 60_000);

    it("serializes role deactivation against role assignment validation", async () => {
      const owner = await createOwner();
      const role = await createCustomRole(owner.actor, [Permission.LeadsRead]);
      let releaseLock: () => void = () => undefined;
      let reportLocked: () => void = () => undefined;
      const holdLock = new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
      const locked = new Promise<void>((resolve) => {
        reportLocked = resolve;
      });

      const assignmentValidation = db.transaction(async (tx) => {
        const result = await roleAssignmentService.checkAssignable(tx, {
          roleIds: [role.id],
          currentRoleIds: [],
        });
        expect(result).toEqual({ ok: true });
        reportLocked();
        await holdLock;
      });

      await locked;
      let concurrentWriteWasBlocked = false;
      try {
        await db.transaction(async (tx) => {
          await tx.execute(sql`set local lock_timeout = '250ms'`);
          await tx
            .update(roles)
            .set({ active: false })
            .where(eq(roles.id, role.id));
        });
      } catch (error: unknown) {
        concurrentWriteWasBlocked = hasErrorCode(
          error,
          PostgresErrorCode.LockNotAvailable,
        );
      } finally {
        releaseLock();
        await assignmentValidation;
      }

      expect(concurrentWriteWasBlocked).toBe(true);
    }, 60_000);
  },
);
