import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
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
import { completeCustomerTask } from "@/server/portal/command-handler/complete-customer-task.command-handler";
import { resolvePortalActor } from "@/server/portal/query-handler/resolve-portal-actor.query-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import { changeTaskStatus } from "@/server/workspace/crm/command-handler/change-task-status.command-handler";
import { tasksMapperService } from "@/server/workspace/crm/services/tasks-mapper-service";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.RBAC_DB_INTEGRATION === "true";
const PREFIX = "integration:portal-task-completion:";
type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "portal task completion PostgreSQL integration",
  () => {
    let db: Database;
    let userId: string;
    let memberId: string;
    let personId: string;
    let customerA: string;
    let customerB: string;
    let membershipA: string;
    let membershipB: string;
    let projectA: string;
    let archivedProject: string;
    let projectB: string;

    const fullRights = [
      Permission.PortalAccess,
      Permission.PortalTasksRead,
      Permission.PortalTasksComplete,
    ];

    function actorFor(permissions: Permission[] = fullRights) {
      return createPortalActor({
        userId,
        membershipId: membershipA,
        personId,
        customerId: customerA,
        permissions: new Set(permissions),
        projectPermissions: new Map(),
      });
    }

    async function insertProject(customerId: string, status: ProjectStatus) {
      const id = randomUUID();
      await db.insert(projects).values({
        id,
        customer_id: customerId,
        owner_member_id: memberId,
        title: `${PREFIX}${status}`,
        status,
        phase: ProjectPhase.Onboarding,
        process_steps: ["Start", "Finish"],
        current_process_step: "Start",
        workflow_key: ProjectWorkflowKey.StandardWebV1,
        billing_model: ProjectBillingModel.FixedPrice,
        included_feedback_rounds: 2,
        version: 1,
      });
      return id;
    }

    async function insertTask(
      projectId: string,
      actionSide: TaskActionSide,
      visible: boolean,
      status: TaskStatus = TaskStatus.Open,
    ) {
      const id = randomUUID();
      await db.insert(tasks).values({
        id,
        project_id: projectId,
        title: `${PREFIX}task`,
        description: "",
        status,
        action_side: actionSide,
        visible_to_customer: visible,
        assignee_member_id: memberId,
        version: 1,
      });
      return id;
    }

    async function readTask(taskId: string) {
      const [row] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (!row) throw new Error("Fixture task is missing.");
      return row;
    }

    async function insertMembership(customerId: string) {
      const id = randomUUID();
      await db.insert(customerContactAssignments).values({
        id: randomUUID(),
        customer_id: customerId,
        person_id: personId,
        is_primary: true,
        version: 1,
      });
      await db.insert(portalMemberships).values({
        id,
        customer_id: customerId,
        person_id: personId,
        user_id: userId,
        activated_at: new Date(),
        email_notifications_enabled: false,
        version: 1,
      });
      await db.insert(portalMembershipRoles).values({
        portal_membership_id: id,
        role_id: SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.PortalStandard].id,
        role_realm: AuthRealm.Portal,
        assigned_by_member_id: memberId,
        assigned_at: new Date(),
      });
      return id;
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
        preferred_locale: "de",
        version: 1,
      });
      await db.insert(customers).values(
        [customerA, customerB].map((id) => ({
          id,
          display_name: `${PREFIX}${id}`,
          status: CustomerStatus.Active,
          owner_member_id: memberId,
          version: 1,
        })),
      );
      membershipA = await insertMembership(customerA);
      membershipB = await insertMembership(customerB);
      projectA = await insertProject(customerA, ProjectStatus.Active);
      archivedProject = await insertProject(customerA, ProjectStatus.Archived);
      projectB = await insertProject(customerB, ProjectStatus.Active);
    }, 60_000);

    afterAll(async () => {
      if (!db) return;
      await db
        .delete(activities)
        .where(inArray(activities.customer_id, [customerA, customerB]));
      await db
        .delete(projects)
        .where(inArray(projects.id, [projectA, archivedProject, projectB]));
      await db
        .delete(portalMemberships)
        .where(inArray(portalMemberships.id, [membershipA, membershipB]));
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
      await db.delete(people).where(eq(people.id, personId));
      await db
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.id, memberId));
      await db.delete(users).where(eq(users.id, userId));
    }, 60_000);

    it("completes a released customer task exactly once with portal origin and one customer activity", async () => {
      const taskId = await insertTask(projectA, TaskActionSide.Customer, true);

      const results = await Promise.all([
        completeCustomerTask(actorFor(), taskId),
        completeCustomerTask(actorFor(), taskId),
      ]);

      expect(results).toEqual(
        expect.arrayContaining([
          { ok: true, alreadyDone: false },
          { ok: true, alreadyDone: true },
        ]),
      );
      const row = await readTask(taskId);
      expect(row.status).toBe(TaskStatus.Done);
      expect(row.completed_at).toBeInstanceOf(Date);
      expect(row.completed_by_member_id).toBeNull();
      expect(row.completed_by_portal_membership_id).toBe(membershipA);
      expect(row.version).toBe(2);
      expect(tasksMapperService.toDto(row).completedByCustomer).toBe(true);

      const logged = await db
        .select({
          actorType: activities.actor_type,
          actorUserId: activities.actor_user_id,
          metadata: activities.metadata,
        })
        .from(activities)
        .where(
          and(
            eq(activities.project_id, projectA),
            eq(activities.type, ActivityType.StatusChange),
          ),
        );
      const forTask = logged.filter(
        (entry) =>
          (entry.metadata as Record<string, unknown> | null)?.task_id ===
          taskId,
      );
      expect(forTask).toHaveLength(1);
      expect(forTask[0]).toMatchObject({
        actorType: ActorType.Customer,
        actorUserId: userId,
      });
      expect(JSON.stringify(forTask[0]?.metadata)).not.toContain(PREFIX);
    });

    it("answers not-found for foreign, internal, hidden, archived-project and cancelled tasks", async () => {
      const candidates = [
        await insertTask(projectB, TaskActionSide.Customer, true),
        await insertTask(projectA, TaskActionSide.Internal, true),
        await insertTask(projectA, TaskActionSide.Internal, false),
        await insertTask(archivedProject, TaskActionSide.Customer, true),
        await insertTask(
          projectA,
          TaskActionSide.Customer,
          true,
          TaskStatus.Cancelled,
        ),
      ];

      for (const taskId of candidates) {
        await expect(completeCustomerTask(actorFor(), taskId)).resolves.toEqual(
          { ok: false, code: PortalTaskErrorCode.NotFound },
        );
        expect((await readTask(taskId)).completed_at).toBeNull();
      }
      await expect(
        completeCustomerTask(actorFor(), randomUUID()),
      ).resolves.toEqual({ ok: false, code: PortalTaskErrorCode.NotFound });
      await expect(
        completeCustomerTask(actorFor(), "not-a-uuid"),
      ).resolves.toEqual({ ok: false, code: PortalTaskErrorCode.NotFound });
    });

    it("answers not-found without the completion permission", async () => {
      const taskId = await insertTask(projectA, TaskActionSide.Customer, true);

      await expect(
        completeCustomerTask(
          actorFor([Permission.PortalAccess, Permission.PortalTasksRead]),
          taskId,
        ),
      ).resolves.toEqual({ ok: false, code: PortalTaskErrorCode.NotFound });
      expect((await readTask(taskId)).status).toBe(TaskStatus.Open);
    });

    it("clears the portal origin when the team reopens the task in the CRM", async () => {
      const taskId = await insertTask(projectA, TaskActionSide.Customer, true);
      await completeCustomerTask(actorFor(), taskId);

      const reopened = await changeTaskStatus(
        taskId,
        { status: TaskStatus.Open, version: 2 },
        { ...workspaceActorWith(), userId },
      );

      expect(reopened).toMatchObject({
        ok: true,
        task: { completedByCustomer: false, completedAt: null },
      });
      const row = await readTask(taskId);
      expect(row.completed_by_portal_membership_id).toBeNull();
      expect(row.completed_by_member_id).toBeNull();
    });

    it("resolves no actor for a revoked membership, so the route answers 404", async () => {
      await db
        .update(portalMemberships)
        .set({ revoked_at: new Date() })
        .where(eq(portalMemberships.id, membershipB));

      const resolved = await resolvePortalActor(
        `${PREFIX}${userId}`,
        customerB,
      );

      expect(resolved.ok).toBe(false);
    });
  },
);
