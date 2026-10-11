import "server-only";

import { and, asc, eq, sql, type SQL } from "drizzle-orm";

import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";
import {
  computeCustomerHoursBalance,
  computeProjectHoursBalance,
} from "@invessiv/common/patterns/crm/hours/hours-balance";
import type { ContactDatabaseReader } from "@invessiv/db/core";
import {
  customerHourPurchases,
  projectHourAllocations,
  projectTimeEntries,
  projects,
} from "@invessiv/db/record-configuration";
import type { ProjectHoursSums } from "@invessiv/common/contracts/crm/hours/project-hours-sums";

/** Sum of every purchase row of the customer; corrections are negative and already included. */
async function loadPurchasedMinutes(
  reader: ContactDatabaseReader,
  customerId: string,
): Promise<number> {
  const [row] = await reader
    .select({
      minutes: sql<number>`coalesce(sum(${customerHourPurchases.minutes}), 0)`,
    })
    .from(customerHourPurchases)
    .where(eq(customerHourPurchases.customer_id, customerId));
  return Number(row?.minutes ?? 0);
}

/**
 * One row per project of the customer in a single statement, including projects without any
 * ledger row. `condition` narrows the projects (an access scope); it never changes what a project
 * that passes it sums up to.
 */
async function loadProjectSums(
  reader: ContactDatabaseReader,
  customerId: string,
  condition?: SQL,
): Promise<ProjectHoursSums[]> {
  const allocated = reader
    .select({
      projectId: projectHourAllocations.project_id,
      minutes: sql<number>`sum(${projectHourAllocations.minutes})`.as(
        "allocated_minutes",
      ),
    })
    .from(projectHourAllocations)
    .where(eq(projectHourAllocations.customer_id, customerId))
    .groupBy(projectHourAllocations.project_id)
    .as("allocated");
  const booked = reader
    .select({
      projectId: projectTimeEntries.project_id,
      used: sql<number>`coalesce(sum(${projectTimeEntries.duration_minutes}) filter (where ${projectTimeEntries.billable}), 0)`.as(
        "used_minutes",
      ),
      goodwill:
        sql<number>`coalesce(sum(${projectTimeEntries.duration_minutes}) filter (where not ${projectTimeEntries.billable}), 0)`.as(
          "goodwill_minutes",
        ),
    })
    .from(projectTimeEntries)
    .where(eq(projectTimeEntries.customer_id, customerId))
    .groupBy(projectTimeEntries.project_id)
    .as("booked");

  const rows = await reader
    .select({
      projectId: projects.id,
      title: projects.title,
      status: projects.status,
      allocatedMinutes: sql<number>`coalesce(${allocated.minutes}, 0)`,
      usedMinutes: sql<number>`coalesce(${booked.used}, 0)`,
      goodwillMinutes: sql<number>`coalesce(${booked.goodwill}, 0)`,
    })
    .from(projects)
    .leftJoin(allocated, eq(allocated.projectId, projects.id))
    .leftJoin(booked, eq(booked.projectId, projects.id))
    .where(and(eq(projects.customer_id, customerId), condition))
    .orderBy(asc(projects.created_at), asc(projects.id));

  // Postgres returns sum() over integers as bigint, which the driver hands over as a string.
  return rows.map((row) => ({
    ...row,
    allocatedMinutes: Number(row.allocatedMinutes),
    usedMinutes: Number(row.usedMinutes),
    goodwillMinutes: Number(row.goodwillMinutes),
  }));
}

/** The figures of one project after a write; null when it is not a project of this customer. */
async function loadProjectBalance(
  reader: ContactDatabaseReader,
  customerId: string,
  projectId: string,
): Promise<ProjectHoursBalanceDto | null> {
  const [sums] = await loadProjectSums(
    reader,
    customerId,
    eq(projects.id, projectId),
  );
  return sums ? computeProjectHoursBalance(sums) : null;
}

/** The customer-wide figures; `projectSums` must cover every project of the customer. */
function toCustomerBalance(
  purchasedMinutes: number,
  projectSums: readonly ProjectHoursSums[],
): CustomerHoursBalanceDto {
  return computeCustomerHoursBalance({
    purchasedMinutes,
    allocatedMinutes: projectSums.reduce(
      (total, project) => total + project.allocatedMinutes,
      0,
    ),
    usedMinutes: projectSums.reduce(
      (total, project) => total + project.usedMinutes,
      0,
    ),
    goodwillMinutes: projectSums.reduce(
      (total, project) => total + project.goodwillMinutes,
      0,
    ),
  });
}

export const hoursBalanceService = {
  loadPurchasedMinutes,
  loadProjectSums,
  loadProjectBalance,
  toCustomerBalance,
} as const;
