import "server-only";
import { crmTargetExists } from "../crm-target-exists";
import { and, eq, isNull, type SQL } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FileStatus } from "@invessiv/common/constants/files/file-status";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
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

/** Finished, not orphaned entries inside the actor's `files.read` scope; what the chat may show. */
function readableCondition(actor: WorkspaceActor): SQL {
  return and(
    eq(files.status, FileStatus.Ready),
    isNull(files.orphaned_at),
    condition(actor, Permission.FilesRead),
  )!;
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

export const fileAccessService = {
  condition,
  readableCondition,
  targetExists: crmTargetExists,
  lock,
};
