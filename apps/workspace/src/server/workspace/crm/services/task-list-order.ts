import "server-only";

import { inArray, sql } from "drizzle-orm";

import { OPEN_TASK_STATUS_VALUES } from "@invessiv/common/constants/crm/task-statuses";
import { tasks } from "@invessiv/db/record-configuration";

const isStillOpen = inArray(tasks.status, [...OPEN_TASK_STATUS_VALUES]);

/**
 * One order for every task list: tasks that still demand action first, soonest due first (which
 * puts overdue ones on top) with undated ones last, then oldest first; closed tasks follow,
 * most recently changed first.
 */
function orderBy() {
  return [
    sql`case when
        ${isStillOpen}
        then
        0
        else
        1
        end asc`,
    sql`case when
        ${isStillOpen}
        then
        ${tasks.due_on}
        end asc nulls last`,
    sql`case when
        ${isStillOpen}
        then
        ${tasks.created_at}
        end asc`,
    sql`case when
        ${isStillOpen}
        then
        null
        else
        ${tasks.updated_at}
        end desc`,
    sql`${tasks.id}
        asc`,
  ];
}

export const taskListOrderService = { orderBy } as const;
