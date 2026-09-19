import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { eq, inArray, like, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import {
  Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customers,
  projects,
  roles,
  securityEvents,
  users,
  workspaceMemberRoles,
  workspaceMembers,
  workspaceMemberScopedRoles,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { createRole } from "@/server/workspace/access/command-handler/create-role.command-handler";
import { accessLookupReadService } from "@/server/workspace/access/services/access-lookup-read-service";
import { accessScopeReadService } from "@/server/workspace/access/services/access-scope-read-service";
import { workspaceMemberReadService } from "@/server/workspace/access/services/workspace-member-read-service";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.RBAC_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:access-scope-read:";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "access scope read and lookup PostgreSQL integration",
  () => {
    let db: Database;
    let manager: { userId: string; memberId: string; actor: WorkspaceActor };
    let customerAlpha: string;
    let customerBeta: string;
    let projectAlphaSite: string;
    let projectAlphaShop: string;
    let projectBetaSite: string;
    let roleCustomers: string;
    let roleProjects: string;
    let memberAnna: string;
    let memberBen: string;
    let memberCleo: string;
    const grants: Record<string, string> = {};

    async function createMember(label: string) {
      const userId = randomUUID();
      const memberId = randomUUID();
      await db.insert(users).values({
        id: userId,
        clerk_user_id: `${FIXTURE_PREFIX}${userId}`,
        primary_email: `${FIXTURE_PREFIX}${userId}@example.test`,
        display_name: `${FIXTURE_PREFIX}${label}`,
        active: true,
        version: 1,
      });
      await db.insert(workspaceMembers).values({
        id: memberId,
        user_id: userId,
        active: true,
        version: 1,
      });
      return { userId, memberId };
    }

    async function createCustomer(label: string) {
      const id = randomUUID();
      await db.insert(customers).values({
        id,
        display_name: `${FIXTURE_PREFIX}customer:${label}`,
        status: CustomerStatus.Active,
        owner_member_id: manager.memberId,
        version: 1,
      });
      return id;
    }

    async function createProject(customerId: string, title: string) {
      const id = randomUUID();
      await db.insert(projects).values({
        id,
        customer_id: customerId,
        owner_member_id: manager.memberId,
        title,
        status: ProjectStatus.Active,
        phase: ProjectPhase.Onboarding,
        process_steps: [ProjectPhase.Onboarding],
        current_process_step: ProjectPhase.Onboarding,
        workflow_key: ProjectWorkflowKey.StandardWebV1,
        billing_model: ProjectBillingModel.FixedPrice,
        included_feedback_rounds: 2,
        version: 1,
      });
      return id;
    }

    async function createBindableRole(name: string, permission: Permission) {
      const result = await createRole(
        {
          name: `${FIXTURE_PREFIX}${name}`,
          description: null,
          permissions: [permission],
          scopeAssignable: true,
        },
        manager.actor,
      );
      if (!result.ok) {
        throw new Error(`Fixture role could not be created: ${result.code}`);
      }
      return result.role.id;
    }

    async function grant(
      key: string,
      memberId: string,
      roleId: string,
      customerId: string,
      projectId: string | null,
    ) {
      const id = randomUUID();
      grants[key] = id;
      await db.insert(workspaceMemberScopedRoles).values({
        id,
        workspace_member_id: memberId,
        role_id: roleId,
        role_realm: AuthRealm.Workspace,
        role_scope_assignable: true,
        customer_id: customerId,
        project_id: projectId,
        assigned_by_user_id: manager.userId,
        assigned_at: new Date(),
      });
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
          "Development database URL is not configured for the access scope read integration test.",
        );
      }
      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();

      const created = await createMember("manager");
      manager = {
        ...created,
        actor: {
          userId: created.userId,
          workspaceMemberId: created.memberId,
          permissions: new Set(PERMISSION_VALUES),
          customerPermissions: new Map(),
          projectPermissions: new Map(),
        },
      };

      customerAlpha = await createCustomer("alpha");
      customerBeta = await createCustomer("beta");
      projectAlphaSite = await createProject(customerAlpha, "Alpha site");
      projectAlphaShop = await createProject(customerAlpha, "Alpha shop");
      projectBetaSite = await createProject(customerBeta, "Beta site");

      roleCustomers = await createBindableRole(
        "customers",
        Permission.CustomersRead,
      );
      roleProjects = await createBindableRole(
        "projects",
        Permission.ProjectsRead,
      );

      memberAnna = (await createMember("anna")).memberId;
      memberBen = (await createMember("ben")).memberId;
      memberCleo = (await createMember("cleo")).memberId;

      await grant("annaBeta", memberAnna, roleCustomers, customerBeta, null);
      await grant(
        "annaAlphaSite",
        memberAnna,
        roleProjects,
        customerAlpha,
        projectAlphaSite,
      );
      await grant("annaAlpha", memberAnna, roleCustomers, customerAlpha, null);
      await grant("benAlpha", memberBen, roleCustomers, customerAlpha, null);
      await grant(
        "cleoAlphaShop",
        memberCleo,
        roleProjects,
        customerAlpha,
        projectAlphaShop,
      );
    }, 60_000);

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
          // Scoped grants restrict customers, projects and roles, so they go first.
          await db
            .delete(workspaceMemberScopedRoles)
            .where(
              inArray(
                workspaceMemberScopedRoles.workspace_member_id,
                memberIds,
              ),
            );
          await db
            .delete(customers)
            .where(inArray(customers.owner_member_id, memberIds));
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
    }, 60_000);

    it("lists a member's grants with names, customer-level grants before project grants", async () => {
      const entries = await accessScopeReadService.listByMember(db, memberAnna);

      expect(entries.map((entry) => entry.id)).toEqual([
        grants.annaAlpha,
        grants.annaAlphaSite,
        grants.annaBeta,
      ]);
      const [alpha, alphaSite] = entries;
      expect(alpha).toMatchObject({
        workspaceMemberId: memberAnna,
        memberDisplayName: `${FIXTURE_PREFIX}anna`,
        roleId: roleCustomers,
        roleName: `${FIXTURE_PREFIX}customers`,
        roleSystemKey: null,
        roleActive: true,
        scope: { type: AccessScopeType.Customer, customerId: customerAlpha },
        customerDisplayName: `${FIXTURE_PREFIX}customer:alpha`,
        projectTitle: null,
      });
      expect(alphaSite).toMatchObject({
        scope: {
          type: AccessScopeType.Project,
          customerId: customerAlpha,
          projectId: projectAlphaSite,
        },
        projectTitle: "Alpha site",
      });
    });

    it("lists a customer's grants for everyone, ordered by scope and then by person", async () => {
      const entries = await accessScopeReadService.listByCustomer(
        db,
        customerAlpha,
      );

      // Customer level first (Anna, then Ben), then projects by title: "Alpha shop" < "Alpha site".
      expect(entries.map((entry) => entry.id)).toEqual([
        grants.annaAlpha,
        grants.benAlpha,
        grants.cleoAlphaShop,
        grants.annaAlphaSite,
      ]);
      expect(
        entries.every((entry) => entry.scope.customerId === customerAlpha),
      ).toBe(true);
    });

    it("counts every grant of a member on the member list", async () => {
      const anna = await workspaceMemberReadService.findById(db, memberAnna);

      expect(anna?.accessScopeCount).toBe(3);
      expect(anna?.hasActiveRole).toBe(true);
    });

    it("keeps counting a grant whose role is inactive but no longer counts it as an active role", async () => {
      await db
        .update(roles)
        .set({ active: false })
        .where(eq(roles.id, roleProjects));

      const cleo = await workspaceMemberReadService.findById(db, memberCleo);
      const entries = await accessScopeReadService.listByMember(db, memberCleo);

      expect(cleo?.accessScopeCount).toBe(1);
      expect(cleo?.hasActiveRole).toBe(false);
      expect(entries.map((entry) => entry.roleActive)).toEqual([false]);
    });

    it("finds fixture customers by name in name order with exactly three fields", async () => {
      const options = await accessLookupReadService.searchCustomers(
        db,
        `${FIXTURE_PREFIX}customer:`,
      );

      expect(options.map((option) => option.id)).toEqual([
        customerAlpha,
        customerBeta,
      ]);
      for (const option of options) {
        expect(Object.keys(option).sort()).toEqual([
          "customerNumber",
          "displayName",
          "id",
        ]);
      }
    });

    it("lists the customer with exactly that number first, ahead of longer numbers containing it", async () => {
      const [alpha] = await db
        .select({ number: customers.customer_number })
        .from(customers)
        .where(eq(customers.id, customerAlpha));
      // The decoy's number starts with alpha's and its name sorts earlier, so name order alone
      // would put it first.
      const decoyId = randomUUID();
      await db.insert(customers).values({
        id: decoyId,
        customer_number: Number(`${alpha.number}0`),
        display_name: `${FIXTURE_PREFIX}customer:0-decoy`,
        status: CustomerStatus.Active,
        owner_member_id: manager.memberId,
        version: 1,
      });

      const options = await accessLookupReadService.searchCustomers(
        db,
        String(alpha.number),
      );

      expect(options[0]?.id).toBe(customerAlpha);
      expect(options.some((option) => option.id === decoyId)).toBe(true);
    });

    it("does not fail on a numeric search larger than the integer column", async () => {
      await expect(
        accessLookupReadService.searchCustomers(db, "9".repeat(100)),
      ).resolves.toEqual([]);
    });

    it("matches a percent sign literally instead of as a wildcard", async () => {
      const options = await accessLookupReadService.searchCustomers(
        db,
        `${FIXTURE_PREFIX}customer:%`,
      );

      expect(options).toEqual([]);
    });

    it("lists only the projects of the asked customer with exactly three fields", async () => {
      const alphaProjects =
        await accessLookupReadService.listProjectsOfCustomer(db, customerAlpha);
      const betaProjects = await accessLookupReadService.listProjectsOfCustomer(
        db,
        customerBeta,
      );

      expect(alphaProjects.map((project) => project.title)).toEqual([
        "Alpha shop",
        "Alpha site",
      ]);
      expect(betaProjects.map((project) => project.id)).toEqual([
        projectBetaSite,
      ]);
      expect(Object.keys(alphaProjects[0]).sort()).toEqual([
        "customerId",
        "id",
        "title",
      ]);
    });

    it("answers an unknown customer with an empty list", async () => {
      await expect(
        accessLookupReadService.listProjectsOfCustomer(db, randomUUID()),
      ).resolves.toEqual([]);
    });
  },
);
