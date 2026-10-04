import "server-only";

import { and, eq, inArray, type SQL } from "drizzle-orm";

import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects, tasks } from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalProjectCondition } from "./portal-project-condition";

/**
 * The single definition of "a customer-side task released to this contact": a visible project of
 * the contact's company, the customer's turn, and visible. Every portal task command repeats it in
 * its UPDATE, so a foreign, internal or hidden task is never written.
 */
export function portalCustomerTaskCondition(
  actor: PortalActor,
  taskId: string,
  permission: Permission,
): SQL {
  return and(
    eq(tasks.id, taskId),
    eq(tasks.action_side, TaskActionSide.Customer),
    eq(tasks.visible_to_customer, true),
    inArray(
      tasks.project_id,
      getDrizzleDatabaseClient()
        .select({ id: projects.id })
        .from(projects)
        .where(portalProjectCondition(actor, permission)),
    ),
  )!;
}
