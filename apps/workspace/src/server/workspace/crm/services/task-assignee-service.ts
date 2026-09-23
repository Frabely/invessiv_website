import "server-only";

import { and, eq } from "drizzle-orm";

import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { workspaceMembers } from "@invessiv/db/record-configuration";

type Executor =
  ContactDatabaseTransaction | ReturnType<typeof getDrizzleDatabaseClient>;

/** A task can only be assigned to a member who can still act on it. */
async function isActiveMember(
  executor: Executor,
  memberId: string,
): Promise<boolean> {
  const [member] = await executor
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.id, memberId), eq(workspaceMembers.active, true)),
    )
    .limit(1);
  return member !== undefined;
}

export const taskAssigneeService = { isActiveMember } as const;
