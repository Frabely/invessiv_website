import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
  portalMembershipRoles,
  portalMemberships,
  projects,
  tasks,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { createPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { getPortalDashboard } from "@/server/portal/query-handler/get-portal-dashboard.query-handler";
import { resolvePortalActor } from "@/server/portal/query-handler/resolve-portal-actor.query-handler";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.RBAC_DB_INTEGRATION === "true";
const TODAY = "2026-09-26";
const PREFIX = "integration:portal-dashboard:";
type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "portal dashboard PostgreSQL integration",
  () => {
    let db: Database;
    let userId: string;
    let memberId: string;
    let personId: string;
    let customerA: string;
    let customerB: string;
    let projectA: string;
    let projectB: string;
    const projectIds: string[] = [];
    const membershipIds: string[] = [];

    function actor(customerId: string, permissions: Permission[]) {
      return createPortalActor({
        userId,
        membershipId: randomUUID(),
        personId,
        firstName: null,
        customerId,
        permissions: new Set(permissions),
        projectPermissions: new Map(),
      });
    }

    const fullRead = [
      Permission.PortalAccess,
      Permission.PortalProjectsRead,
      Permission.PortalTasksRead,
      Permission.PortalTasksComplete,
    ];

    async function insertProject(
      customerId: string,
      status: ProjectStatus,
      title: string,
    ) {
      const id = randomUUID();
      projectIds.push(id);
      await db.insert(projects).values({
        id,
        customer_id: customerId,
        owner_member_id: memberId,
        title: `${PREFIX}${title}`,
        status,
        phase: ProjectPhase.Onboarding,
        process_steps: ["Start", "Finish"],
        current_process_step: "Start",
        workflow_key: ProjectWorkflowKey.StandardWebV1,
        billing_model: ProjectBillingModel.FixedPrice,
        included_feedback_rounds: 2,
        budget_cents: 990000,
        version: 1,
      });
      return id;
    }

    async function insertTask(
      projectId: string,
      title: string,
      actionSide: TaskActionSide,
      visible: boolean,
      status: TaskStatus = TaskStatus.Open,
    ) {
      await db.insert(tasks).values({
        id: randomUUID(),
        project_id: projectId,
        title: `${PREFIX}${title}`,
        description: "Public detail",
        status,
        action_side: actionSide,
        visible_to_customer: visible,
        assignee_member_id: memberId,
        due_on: "2026-09-20",
        version: 1,
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
      if (!databaseUrl)
        throw new Error("Development database URL is not configured.");
      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();

      userId = randomUUID();
      memberId = randomUUID();
      personId = randomUUID();
      customerA = randomUUID();
      customerB = randomUUID();
      await db.insert(users).values({
        id: userId,
        clerk_user_id: `${PREFIX}${userId}`,
        primary_email: `${userId}@example.test`,
        display_name: "Portal contact",
        version: 1,
        active: true,
      });
      await db.insert(workspaceMembers).values({
        id: memberId,
        user_id: userId,
        active: true,
        version: 1,
      });
      await db.insert(people).values({
        id: personId,
        display_name: "Portal contact",
        first_name: null,
        preferred_locale: "de",
        version: 1,
      });
      await db.insert(customers).values([
        {
          id: customerA,
          display_name: `${PREFIX}A`,
          status: CustomerStatus.Active,
          owner_member_id: memberId,
          version: 1,
        },
        {
          id: customerB,
          display_name: `${PREFIX}B`,
          status: CustomerStatus.Active,
          owner_member_id: memberId,
          version: 1,
        },
      ]);

      for (const customerId of [customerA, customerB]) {
        await db.insert(customerContactAssignments).values({
          id: randomUUID(),
          customer_id: customerId,
          person_id: personId,
          is_primary: true,
          version: 1,
        });
        const membershipId = randomUUID();
        membershipIds.push(membershipId);
        await db.insert(portalMemberships).values({
          id: membershipId,
          customer_id: customerId,
          person_id: personId,
          user_id: userId,
          activated_at: new Date(),
          email_notifications_enabled: false,
          version: 1,
        });
        await db.insert(portalMembershipRoles).values({
          portal_membership_id: membershipId,
          role_id: SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.PortalStandard].id,
          role_realm: AuthRealm.Portal,
          assigned_by_member_id: memberId,
          assigned_at: new Date(),
        });
      }

      projectA = await insertProject(
        customerA,
        ProjectStatus.Active,
        "A active",
      );
      await insertProject(customerA, ProjectStatus.Planned, "A planned");
      await insertProject(customerA, ProjectStatus.Paused, "A paused");
      await insertProject(customerA, ProjectStatus.Completed, "A completed");
      const archived = await insertProject(
        customerA,
        ProjectStatus.Archived,
        "A archived",
      );
      const cancelled = await insertProject(
        customerA,
        ProjectStatus.Cancelled,
        "A cancelled",
      );
      projectB = await insertProject(
        customerB,
        ProjectStatus.Active,
        "B active",
      );
      await insertTask(projectA, "customer", TaskActionSide.Customer, true);
      await insertTask(projectA, "internal", TaskActionSide.Internal, true);
      await insertTask(projectA, "hidden", TaskActionSide.Internal, false);
      await insertTask(
        projectA,
        "cancelled task",
        TaskActionSide.Internal,
        true,
        TaskStatus.Cancelled,
      );
      await insertTask(archived, "archived", TaskActionSide.Customer, true);
      await insertTask(
        cancelled,
        "cancelled project",
        TaskActionSide.Customer,
        true,
      );
      await insertTask(projectB, "foreign", TaskActionSide.Customer, true);
    }, 60_000);

    afterAll(async () => {
      if (!db) return;
      if (projectIds.length) {
        await db.delete(projects).where(inArray(projects.id, projectIds));
      }
      if (membershipIds.length) {
        await db
          .delete(portalMemberships)
          .where(inArray(portalMemberships.id, membershipIds));
      }
      if (customerA && customerB) {
        await db
          .delete(customerContactAssignments)
          .where(
            inArray(customerContactAssignments.customer_id, [
              customerA,
              customerB,
            ]),
          );
        await db
          .delete(customers)
          .where(inArray(customers.id, [customerA, customerB]));
      }
      if (personId)
        await db.delete(people).where(inArray(people.id, [personId]));
      if (memberId)
        await db
          .delete(workspaceMembers)
          .where(inArray(workspaceMembers.id, [memberId]));
      if (userId) await db.delete(users).where(inArray(users.id, [userId]));
    }, 60_000);

    it("returns only released rows of the selected customer in three queries", async () => {
      const select = vi.spyOn(db, "select");
      const dto = await getPortalDashboard(actor(customerA, fullRead), TODAY);
      expect(select).toHaveBeenCalledTimes(3);
      select.mockRestore();

      expect(dto.customer.displayName).toBe(`${PREFIX}A`);
      expect(dto.projects).toHaveLength(3);
      expect(dto.completedProjects).toHaveLength(1);
      expect(dto.customerTasks.map((task) => task.title)).toEqual([
        `${PREFIX}customer`,
      ]);
      expect(dto.ourTasks.map((task) => task.title)).toEqual([
        `${PREFIX}internal`,
      ]);
      expect(JSON.stringify(dto)).not.toContain(`${PREFIX}foreign`);
      expect(JSON.stringify(dto)).not.toContain(`${PREFIX}hidden`);
      expect(JSON.stringify(dto)).not.toContain(`${PREFIX}cancelled task`);
      expect(JSON.stringify(dto)).not.toContain(`${PREFIX}archived`);
      expect(JSON.stringify(dto)).not.toContain(`${PREFIX}cancelled`);
      expect(JSON.stringify(dto)).not.toContain("990000");
      expect(Object.keys(dto)).toEqual([
        "customer",
        "contact",
        "projects",
        "completedProjects",
        "customerTasks",
        "ourTasks",
        "capabilities",
      ]);
      expect(Object.keys(dto.projects[0]!)).toEqual([
        "id",
        "title",
        "status",
        "processSteps",
        "currentProcessStep",
        "nextStep",
        "previewUrl",
        "projectLead",
      ]);
      expect(Object.keys(dto.customerTasks[0]!)).toEqual([
        "id",
        "projectId",
        "projectTitle",
        "title",
        "description",
        "dueOn",
        "dueState",
        "done",
        "completedAt",
        "version",
      ]);
      expect(Object.keys(dto.ourTasks[0]!)).toEqual([
        "id",
        "projectId",
        "projectTitle",
        "title",
        "description",
        "dueOn",
        "dueState",
        "done",
        "completedAt",
      ]);
    });

    it("keeps a second company's dashboard isolated for the same person", async () => {
      const first = await resolvePortalActor(`${PREFIX}${userId}`, customerA);
      const second = await resolvePortalActor(`${PREFIX}${userId}`, customerB);
      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      if (!first.ok || !second.ok)
        throw new Error("Fixture memberships did not resolve.");
      expect(first.actor.membershipId).not.toBe(second.actor.membershipId);
      const firstDto = await getPortalDashboard(first.actor, TODAY);
      const dto = await getPortalDashboard(second.actor, TODAY);
      expect(firstDto.customer.displayName).toBe(`${PREFIX}A`);
      expect(firstDto.projects.every((row) => row.id !== projectB)).toBe(true);
      expect(dto.customer.displayName).toBe(`${PREFIX}B`);
      expect(dto.projects.map((row) => row.id)).toEqual([projectB]);
      expect(dto.customerTasks.map((row) => row.title)).toEqual([
        `${PREFIX}foreign`,
      ]);
    });

    it("returns empty sections without the corresponding read permissions", async () => {
      const noTasks = await getPortalDashboard(
        actor(customerA, [
          Permission.PortalAccess,
          Permission.PortalProjectsRead,
        ]),
        TODAY,
      );
      expect(noTasks.projects).toHaveLength(3);
      expect(noTasks.customerTasks).toEqual([]);
      expect(noTasks.ourTasks).toEqual([]);
      expect(noTasks.capabilities.canCompleteTasks).toBe(false);

      const noProjects = await getPortalDashboard(
        actor(customerA, [Permission.PortalAccess, Permission.PortalTasksRead]),
        TODAY,
      );
      expect(noProjects.projects).toEqual([]);
      expect(noProjects.completedProjects).toEqual([]);
      expect(noProjects.customerTasks).toHaveLength(1);
    });

    it("returns a valid empty DTO and the same data to an owner reader", async () => {
      const emptyCustomerId = randomUUID();
      await db.insert(customers).values({
        id: emptyCustomerId,
        display_name: `${PREFIX}empty`,
        status: CustomerStatus.Active,
        owner_member_id: memberId,
        version: 1,
      });
      try {
        const empty = await getPortalDashboard(
          actor(emptyCustomerId, fullRead),
          TODAY,
        );
        expect(empty.projects).toEqual([]);
        expect(empty.customerTasks).toEqual([]);
        expect(empty.ourTasks).toEqual([]);
      } finally {
        await db
          .delete(customers)
          .where(inArray(customers.id, [emptyCustomerId]));
      }

      const contact = await getPortalDashboard(
        actor(customerA, fullRead),
        TODAY,
      );
      const owner = await getPortalDashboard(
        createPortalOwnerView({
          userId,
          customerId: customerA,
          permissions: new Set([
            Permission.PortalAccess,
            Permission.PortalProjectsRead,
            Permission.PortalTasksRead,
          ]),
        }),
        TODAY,
      );
      expect({ ...owner, capabilities: contact.capabilities }).toEqual(contact);
      expect(owner.capabilities).toEqual({
        canCompleteTasks: false,
        isOwnerView: true,
      });
    });
  },
);
