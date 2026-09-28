import "server-only";
import { and, eq } from "drizzle-orm";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { customers, files, projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

function condition(actor: WorkspaceActor, permission: Permission) {
  return crmAccessCondition.forScope(accessScope(actor, permission), {
    customerId: files.customer_id,
    projectId: files.project_id,
  });
}

async function targetExists(
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

async function lock(
  tx: ContactDatabaseTransaction,
  id: string,
  actor: WorkspaceActor,
  permission: Permission,
) {
  const [row] = await tx
    .select()
    .from(files)
    .where(and(eq(files.id, id), condition(actor, permission)))
    .limit(1)
    .for("update");
  if (
    !row ||
    !canOn(actor, permission, {
      customerId: row.customer_id,
      projectId: row.project_id ?? undefined,
    })
  )
    return null;
  return row;
}

export const fileAccessService = { condition, targetExists, lock };
