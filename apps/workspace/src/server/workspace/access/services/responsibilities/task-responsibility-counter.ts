import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";

import { OPEN_TASK_STATUS_VALUES } from "@invessiv/common/constants/crm/task-statuses";
import { tasks } from "@invessiv/db/record-configuration";
import type { AccessDatabaseExecutor } from "@/server/workspace/access/access-types";

async function countOpen(
  executor: AccessDatabaseExecutor,
  memberId: string,
): Promise<number> {
  const [row] = await executor
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.assignee_member_id, memberId),
        inArray(tasks.status, OPEN_TASK_STATUS_VALUES),
      ),
    );

  return row?.count ?? 0;
}

export const taskResponsibilityCounterService = {
  countOpen,
} as const;
