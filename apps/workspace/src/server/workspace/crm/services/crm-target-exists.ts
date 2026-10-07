import "server-only";
import { and, eq } from "drizzle-orm";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { customers, projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";

/** Checks scope and locks the existing customer or its project for a CRM write. */
export async function crmTargetExists(
  tx: ContactDatabaseTransaction,
  customerId: string,
  projectId: string | null,
  actor: WorkspaceActor,
  permission: Permission,
) {
  if (
    !canOn(actor, permission, { customerId, projectId: projectId ?? undefined })
  )
    return false;
  if (projectId) {
    const [row] = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.customer_id, customerId)),
      )
      .limit(1)
      .for("share");
    return !!row;
  }
  const [row] = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1)
    .for("share");
  return !!row;
}
