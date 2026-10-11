import { randomUUID } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerHourPurchases,
  projectHourAllocations,
  projectTimeEntries,
  tasks,
} from "@invessiv/db/record-configuration";
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";

type HoursFixtureProject = { customerId: string; projectId: string };

/**
 * Two customers with hours: one whose stock is partly allocated, partly free and partly used
 * (with a goodwill entry), and one with a correction and an overdrawn project. Every other fixture
 * customer stays without hours, so the empty state of the section remains checkable.
 */
export async function seedHours(
  tx: ContactDatabaseTransaction,
  input: {
    memberId: string;
    healthy: HoursFixtureProject;
    overdrawn: HoursFixtureProject;
  },
) {
  const [healthyTask] = await tx
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.project_id, input.healthy.projectId),
        ne(tasks.status, TaskStatus.Cancelled),
      ),
    )
    .limit(1);
  if (!healthyTask)
    throw new Error(
      "Hours fixture requires a linkable task on the healthy project.",
    );
  const purchase = (
    customerId: string,
    minutes: number,
    purchasedOn: string,
    note: string,
  ) => ({
    id: randomUUID(),
    customer_id: customerId,
    kind: minutes > 0 ? HourPurchaseKind.Purchase : HourPurchaseKind.Correction,
    source: HourPurchaseSource.Manual,
    minutes,
    purchased_on: purchasedOn,
    note,
    idempotency_key: randomUUID(),
    created_by_member_id: input.memberId,
  });
  const allocation = (
    project: HoursFixtureProject,
    minutes: number,
    note: string,
  ) => ({
    id: randomUUID(),
    customer_id: project.customerId,
    project_id: project.projectId,
    minutes,
    note,
    idempotency_key: randomUUID(),
    created_by_member_id: input.memberId,
  });
  const entry = (
    project: HoursFixtureProject,
    performedOn: string,
    durationMinutes: number,
    description: string,
    billable = true,
    taskId: string | null = null,
  ) => ({
    id: randomUUID(),
    customer_id: project.customerId,
    project_id: project.projectId,
    task_id: taskId,
    performed_on: performedOn,
    duration_minutes: durationMinutes,
    description,
    billable,
    performed_by_member_id: input.memberId,
    version: 1,
  });

  await tx
    .insert(customerHourPurchases)
    .values([
      purchase(
        input.healthy.customerId,
        600,
        "2026-09-01",
        "Betreuungspaket 10 h",
      ),
      purchase(
        input.overdrawn.customerId,
        300,
        "2026-09-15",
        "Betreuungspaket 5 h",
      ),
      purchase(
        input.overdrawn.customerId,
        -60,
        "2026-09-16",
        "Paket war 4 h, nicht 5 h",
      ),
    ]);

  await tx
    .insert(projectHourAllocations)
    .values([
      allocation(input.healthy, 480, "Betreuung nach dem Launch"),
      allocation(input.overdrawn, 120, ""),
    ]);

  await tx.insert(projectTimeEntries).values([
    entry(
      input.healthy,
      "2026-09-10",
      60,
      "Umbau Hero-Section",
      true,
      healthyTask.id,
    ),
    entry(input.healthy, "2026-09-10", 15, "Impressum aktualisiert"),
    entry(input.healthy, "2026-09-18", 90, "Kontaktformular erweitert"),
    entry(input.healthy, "2026-09-22", 30, "Rückfragen am Telefon", false),
    // Two and a half hours on two allocated ones: the project is overdrawn by half an hour.
    entry(input.overdrawn, "2026-09-20", 150, "Neue Leistungsseite"),
  ]);
}
