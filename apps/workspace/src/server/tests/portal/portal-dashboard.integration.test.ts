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
import { PortalTaskRequestLimits } from "@invessiv/common/constants/portal/portal-task-request-limits";
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
import { listPortalCurrentProjects } from "@/server/portal/query-handler/list-portal-current-projects.query-handler";
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
        feedback_round_positions: [1, 1],
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

    it("returns only released rows of the selected customer", async () => {
      const dto = await getPortalDashboard(actor(customerA, fullRead), TODAY);

      expect(dto.customer.displayName).toBe(`${PREFIX}A`);
      expect(dto.project).not.toBeNull();
      expect(dto.completedProjects).toHaveLength(1);
      expect(Object.keys(dto.completedProjects[0]!)).toEqual([
        "id",
        "title",
        "previewUrl",
      ]);
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
        "selectedProjectId",
        "project",
        "completedProjects",
        "customerTasks",
        "ourTasks",
        "feedback",
        "capabilities",
      ]);
      expect(Object.keys(dto.project!)).toEqual([
        "id",
        "title",
        "status",
        "processSteps",
        "currentProcessStep",
        "feedbackRoundPositions",
        "roundProgress",
        "nextStep",
        "previewUrl",
        "projectLead",
      ]);
      expect(dto.project?.feedbackRoundPositions).toEqual([1, 1]);
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
        "canReopen",
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
        "requestedByCustomer",
        "rejected",
      ]);
    });

    it("returns only the five latest declined customer requests for the selected project", async () => {
      const membershipId = membershipIds[0];
      if (!membershipId)
        throw new Error("Portal membership fixture is missing.");
      const rejectedRows = Array.from(
        { length: PortalTaskRequestLimits.RejectedShown + 3 },
        (_, index) => ({
          id: randomUUID(),
          project_id: projectA,
          title: `${PREFIX}rejected ${index}`,
          description: "",
          status: TaskStatus.Cancelled,
          action_side: TaskActionSide.Internal,
          visible_to_customer: true,
          assignee_member_id: memberId,
          created_by_portal_membership_id: membershipId,
          updated_at: new Date(Date.UTC(2026, 8, 26, 12, 0, index)),
          version: 1,
        }),
      );
      await db.insert(tasks).values(rejectedRows);
      try {
        const dto = await getPortalDashboard(
          actor(customerA, fullRead),
          TODAY,
          projectA,
        );
        expect(
          dto.ourTasks
            .filter((task) => task.rejected)
            .map((task) => task.title),
        ).toEqual([
          `${PREFIX}rejected 7`,
          `${PREFIX}rejected 6`,
          `${PREFIX}rejected 5`,
          `${PREFIX}rejected 4`,
          `${PREFIX}rejected 3`,
        ]);
        expect(dto.ourTasks[0]?.title).toBe(`${PREFIX}internal`);
      } finally {
        await db.delete(tasks).where(
          inArray(
            tasks.id,
            rejectedRows.map((row) => row.id),
          ),
        );
      }
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
      expect(firstDto.project?.id).not.toBe(projectB);
      expect(dto.customer.displayName).toBe(`${PREFIX}B`);
      expect(dto.project?.id).toBe(projectB);
      expect(dto.customerTasks.map((row) => row.title)).toEqual([
        `${PREFIX}foreign`,
      ]);
    });

    it("scopes tasks to a chosen project and ignores a foreign project id", async () => {
      const reader = actor(customerA, fullRead);
      const chosen = await getPortalDashboard(reader, TODAY, projectA);
      expect(chosen.customerTasks.map((task) => task.projectId)).toEqual([
        projectA,
      ]);
      expect(chosen.ourTasks.map((task) => task.projectId)).toEqual([projectA]);

      const defaultView = await getPortalDashboard(reader, TODAY);
      const foreignView = await getPortalDashboard(reader, TODAY, projectB);
      expect(foreignView.customerTasks).toEqual(defaultView.customerTasks);
      expect(foreignView.ourTasks).toEqual(defaultView.ourTasks);
      expect(JSON.stringify(foreignView)).not.toContain(`${PREFIX}foreign`);

      const singleProject = await getPortalDashboard(
        actor(customerB, fullRead),
        TODAY,
      );
      expect(singleProject.project?.id).toBe(projectB);
      expect(singleProject.customerTasks[0]?.projectId).toBe(projectB);
    });

    it("returns empty sections without the corresponding read permissions", async () => {
      const noTasks = await getPortalDashboard(
        actor(customerA, [
          Permission.PortalAccess,
          Permission.PortalProjectsRead,
        ]),
        TODAY,
      );
      expect(noTasks.project).not.toBeNull();
      expect(noTasks.customerTasks).toEqual([]);
      expect(noTasks.ourTasks).toEqual([]);
      expect(noTasks.capabilities.canCompleteTasks).toBe(false);

      const noProjects = await getPortalDashboard(
        actor(customerA, [Permission.PortalAccess, Permission.PortalTasksRead]),
        TODAY,
      );
      expect(noProjects.project).toBeNull();
      expect(noProjects.completedProjects).toEqual([]);
      expect(noProjects.customerTasks.length).toBeGreaterThan(0);
      expect(
        noProjects.customerTasks.every((task) => task.projectId === projectA),
      ).toBe(true);
      expect(noProjects.capabilities.canCompleteTasks).toBe(false);
      expect(
        await listPortalCurrentProjects(
          actor(customerA, [
            Permission.PortalAccess,
            Permission.PortalTasksRead,
          ]),
        ),
      ).toEqual([{ id: projectA, title: `${PREFIX}A active` }]);

      const feedbackOnly = await getPortalDashboard(
        actor(customerA, [
          Permission.PortalAccess,
          Permission.PortalFeedbackRead,
        ]),
        TODAY,
      );
      expect(feedbackOnly.project).toBeNull();
      expect(feedbackOnly.customerTasks).toEqual([]);
      expect(feedbackOnly.feedback).toMatchObject({ projectId: projectA });
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
        expect(empty.project).toBeNull();
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
        canCreateTasks: false,
        isOwnerView: true,
      });
    });
  },
);
