import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { inArray } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customerContactAssignments,
  customers,
  files,
  people,
  portalMemberships,
  projects,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

export function createFileTestFixture() {
  const prefix = `integration:files:${crypto.randomUUID()}:`;
  let db: ReturnType<typeof getDrizzleDatabaseClient>;
  const userId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const personId = crypto.randomUUID();
  const membershipId = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const foreignCustomerId = crypto.randomUUID();
  const projectId = crypto.randomUUID();
  const siblingProjectId = crypto.randomUUID();
  const foreignProjectId = crypto.randomUUID();
  const customerIds = [customerId, foreignCustomerId];

  function actor(overrides: Partial<WorkspaceActor> = {}): WorkspaceActor {
    return {
      userId,
      workspaceMemberId: memberId,
      permissions: new Set([
        Permission.FilesRead,
        Permission.FilesWrite,
        Permission.FilesDelete,
      ]),
      customerPermissions: new Map(),
      projectPermissions: new Map(),
      ...overrides,
    };
  }

  async function setup() {
    const loaded = loadDotenv({
      path: path.join(
        findWorkspaceRoot(process.cwd()),
        ".env.development.local",
      ),
      quiet: true,
    });
    const url =
      process.env.DATABASE_URL_DEVELOPMENT?.trim() ||
      loaded.parsed?.DATABASE_URL?.trim();
    if (!url)
      throw new Error(
        "Development database URL is required for file integration tests",
      );
    process.env.DATABASE_URL = url;
    db = getDrizzleDatabaseClient();
    await db.insert(users).values({
      id: userId,
      clerk_user_id: prefix,
      primary_email: "files@example.test",
      display_name: prefix,
      active: true,
      version: 1,
    });
    await db
      .insert(workspaceMembers)
      .values({ id: memberId, user_id: userId, active: true, version: 1 });
    for (const id of customerIds)
      await db.insert(customers).values({
        id,
        display_name: prefix + id,
        status: CustomerStatus.Active,
        owner_member_id: memberId,
        version: 1,
      });
    await db.insert(people).values({
      id: personId,
      display_name: prefix,
      preferred_locale: Locale.De,
      version: 1,
    });
    await db.insert(customerContactAssignments).values({
      id: crypto.randomUUID(),
      customer_id: customerId,
      person_id: personId,
      is_primary: true,
      version: 1,
    });
    await db.insert(portalMemberships).values({
      id: membershipId,
      customer_id: customerId,
      person_id: personId,
      user_id: userId,
      activated_at: new Date(),
      email_notifications_enabled: false,
      version: 1,
    });
    for (const [id, customer] of [
      [projectId, customerId],
      [siblingProjectId, customerId],
      [foreignProjectId, foreignCustomerId],
    ]) {
      await db.insert(projects).values({
        id,
        customer_id: customer,
        title: prefix + id,
        owner_member_id: memberId,
        status: ProjectStatus.Active,
        phase: ProjectPhase.Onboarding,
        process_steps: [ProjectPhase.Onboarding],
        current_process_step: ProjectPhase.Onboarding,
        workflow_key: ProjectWorkflowKey.StandardWebV1,
        billing_model: ProjectBillingModel.FixedPrice,
        included_feedback_rounds: 2,
        version: 1,
      });
    }
  }

  async function cleanup() {
    if (!db) return;
    await db
      .delete(activities)
      .where(inArray(activities.customer_id, customerIds));
    await db.delete(files).where(inArray(files.customer_id, customerIds));
    await db.delete(projects).where(inArray(projects.customer_id, customerIds));
    await db.delete(customers).where(inArray(customers.id, customerIds));
    await db.delete(people).where(inArray(people.id, [personId]));
    await db
      .delete(workspaceMembers)
      .where(inArray(workspaceMembers.id, [memberId]));
    await db.delete(users).where(inArray(users.id, [userId]));
  }

  return {
    setup,
    cleanup,
    actor,
    database: () => db,
    customerId,
    foreignCustomerId,
    projectId,
    siblingProjectId,
    foreignProjectId,
    memberId,
    membershipId,
  };
}
