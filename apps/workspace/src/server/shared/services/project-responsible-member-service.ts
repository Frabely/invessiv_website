import "server-only";

import { and, eq } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customers,
  projects,
  workspaceMembers,
} from "@invessiv/db/record-configuration";

/**
 * The member who answers for a project right now: its owner, otherwise the owner of its customer,
 * each only while active. The member row stays shared-locked until commit, so it cannot be
 * deactivated between this lookup and the write that names it.
 */
async function findActiveMemberId(
  tx: ContactDatabaseTransaction,
  projectId: string,
): Promise<string | null> {
  const [owners] = await tx
    .select({
      projectOwner: projects.owner_member_id,
      customerOwner: customers.owner_member_id,
    })
    .from(projects)
    .innerJoin(customers, eq(customers.id, projects.customer_id))
    .where(eq(projects.id, projectId));
  if (!owners) return null;
  for (const memberId of [owners.projectOwner, owners.customerOwner]) {
    const [member] = await tx
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, memberId),
          eq(workspaceMembers.active, true),
        ),
      )
      .for("share");
    if (member) return member.id;
  }
  return null;
}

export const projectResponsibleMemberService = { findActiveMemberId } as const;
