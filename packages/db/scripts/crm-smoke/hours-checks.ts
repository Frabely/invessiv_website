/**
 * Hours part of `db:smoke:crm`: what Postgres itself must enforce for the three hours tables, plus
 * the "missing business value is rejected" guard. Rules that span several rows (free hours,
 * releasable hours) belong to the write path and are covered by its integration tests.
 * Every row here hangs on a smoke customer and disappears with it through the cascades.
 */
import { randomUUID } from "node:crypto";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";

import { CustomerHourPurchasesConstraintName as P } from "@invessiv/db/constraint-names/crm/customer-hour-purchases-constraint-names";
import { ProjectHourAllocationsConstraintName as A } from "@invessiv/db/constraint-names/crm/project-hour-allocations-constraint-names";
import { ProjectTimeEntriesConstraintName as E } from "@invessiv/db/constraint-names/crm/project-time-entries-constraint-names";
import type { CrmSmokeContext as SmokeContext } from "./contracts/crm-smoke-context";

type PurchaseArgs = {
  customerId: string;
  kind?: string;
  source?: string;
  minutes?: number;
  note?: string;
  idempotencyKey?: string;
};

type AllocationArgs = {
  customerId: string;
  projectId: string;
  minutes?: number;
  note?: string;
};

type EntryArgs = {
  customerId: string;
  projectId: string;
  taskId?: string | null;
  durationMinutes?: number;
  description?: string;
  version?: number;
};

export async function runHoursChecks(context: SmokeContext) {
  const { sql, memberId, name, expectRejected, expectAccepted } = context;
  const customerId = await context.insertCustomer(name("Hours customer"));
  const otherCustomerId = await context.insertCustomer(
    name("Hours other customer"),
  );
  const insertProject = async (ownerCustomerId: string) => {
    const id = randomUUID();
    await sql`
      INSERT INTO projects (id, customer_id, owner_member_id, title, status, phase, process_steps,
                            current_process_step, workflow_key, billing_model, included_feedback_rounds, version)
      VALUES (${id}, ${ownerCustomerId}, ${memberId}, ${name("Hours project")}, 'active', 'onboarding',
              ARRAY ['onboarding'], 'onboarding', 'standard_web_v1', 'fixed_price', 2, 1)
    `;
    return id;
  };
  const insertTask = async (projectId: string) => {
    const id = randomUUID();
    await sql`
      INSERT INTO tasks (id, project_id, title, description, status, action_side, visible_to_customer,
                         assignee_member_id, version)
      VALUES (${id}, ${projectId}, ${name("Hours task")}, '', 'open', 'internal', FALSE, ${memberId}, 1)
    `;
    return id;
  };
  const projectId = await insertProject(customerId);
  const siblingProjectId = await insertProject(customerId);
  const foreignProjectId = await insertProject(otherCustomerId);
  const taskId = await insertTask(projectId);
  const siblingTaskId = await insertTask(siblingProjectId);

  const insertPurchase = (args: PurchaseArgs) => sql`
    INSERT INTO customer_hour_purchases (id, customer_id, kind, source, minutes, purchased_on, note,
                                         idempotency_key, created_by_member_id)
    VALUES (${randomUUID()}, ${args.customerId}, ${args.kind ?? "purchase"}, ${args.source ?? "manual"},
            ${args.minutes ?? 600}, '2026-10-08', ${args.note ?? ""}, ${args.idempotencyKey ?? randomUUID()},
            ${memberId})
  `;
  const insertAllocation = (args: AllocationArgs) => sql`
    INSERT INTO project_hour_allocations (id, customer_id, project_id, minutes, note, idempotency_key,
                                          created_by_member_id)
    VALUES (${randomUUID()}, ${args.customerId}, ${args.projectId}, ${args.minutes ?? 300}, ${args.note ?? ""},
            ${randomUUID()}, ${memberId})
  `;
  const insertEntry = (args: EntryArgs) => sql`
    INSERT INTO project_time_entries (id, customer_id, project_id, task_id, performed_on, duration_minutes,
                                      description, billable, performed_by_member_id, version)
    VALUES (${randomUUID()}, ${args.customerId}, ${args.projectId}, ${args.taskId ?? null}, '2026-10-08',
            ${args.durationMinutes ?? 60}, ${args.description ?? "Umbau Hero-Section"}, TRUE, ${memberId},
            ${args.version ?? 1})
  `;

  // customer_hour_purchases
  await expectAccepted("purchase is accepted", () =>
    insertPurchase({ customerId }),
  );
  await expectAccepted("negative correction is accepted", () =>
    insertPurchase({ customerId, kind: "correction", minutes: -60 }),
  );
  // Zero breaks the minutes check and the sign check at once; Postgres names either one.
  await expectRejected("purchase of zero minutes is rejected", () =>
    insertPurchase({ customerId, minutes: 0 }),
  );
  await expectRejected(
    "purchase off the 15-minute step is rejected",
    () => insertPurchase({ customerId, minutes: 20 }),
    P.MinutesCheck,
  );
  await expectRejected(
    "purchase with negative minutes is rejected",
    () => insertPurchase({ customerId, minutes: -60 }),
    P.KindSignCheck,
  );
  await expectRejected(
    "correction with positive minutes is rejected",
    () => insertPurchase({ customerId, kind: "correction", minutes: 60 }),
    P.KindSignCheck,
  );
  await expectRejected(
    "unknown purchase kind is rejected",
    () => insertPurchase({ customerId, kind: "refund" }),
    P.KindCheck,
  );
  await expectRejected(
    "unknown purchase source is rejected",
    () => insertPurchase({ customerId, source: "import" }),
    P.SourceCheck,
  );
  await expectRejected(
    "purchase note above the limit is rejected",
    () => insertPurchase({ customerId, note: "x".repeat(201) }),
    P.NoteCheck,
  );
  const sharedKey = randomUUID();
  await insertPurchase({ customerId, idempotencyKey: sharedKey });
  await expectRejected(
    "second purchase with the same idempotency key is rejected",
    () => insertPurchase({ customerId, idempotencyKey: sharedKey }),
    P.IdempotencyKeyUnique,
  );
  await expectRejected(
    "purchase without kind is rejected",
    () => sql`
      INSERT INTO customer_hour_purchases (id, customer_id, source, minutes, purchased_on, note,
                                           idempotency_key, created_by_member_id)
      VALUES (${randomUUID()}, ${customerId}, 'manual', 60, '2026-10-08', '', ${randomUUID()}, ${memberId})
    `,
  );
  await expectRejected(
    "purchase without note is rejected",
    () => sql`
      INSERT INTO customer_hour_purchases (id, customer_id, kind, source, minutes, purchased_on,
                                           idempotency_key, created_by_member_id)
      VALUES (${randomUUID()}, ${customerId}, 'purchase', 'manual', 60, '2026-10-08', ${randomUUID()}, ${memberId})
    `,
  );

  // project_hour_allocations
  await expectAccepted("allocation is accepted", () =>
    insertAllocation({ customerId, projectId }),
  );
  await expectAccepted("release is accepted", () =>
    insertAllocation({ customerId, projectId, minutes: -60 }),
  );
  await expectRejected(
    "allocation of zero minutes is rejected",
    () => insertAllocation({ customerId, projectId, minutes: 0 }),
    A.MinutesCheck,
  );
  await expectRejected(
    "allocation off the 15-minute step is rejected",
    () => insertAllocation({ customerId, projectId, minutes: 50 }),
    A.MinutesCheck,
  );
  await expectRejected(
    "allocation to another customer's project is rejected",
    () => insertAllocation({ customerId, projectId: foreignProjectId }),
    A.ProjectCustomerForeignKey,
  );
  await expectRejected(
    "allocation without note is rejected",
    () => sql`
      INSERT INTO project_hour_allocations (id, customer_id, project_id, minutes, idempotency_key,
                                            created_by_member_id)
      VALUES (${randomUUID()}, ${customerId}, ${projectId}, 60, ${randomUUID()}, ${memberId})
    `,
  );

  // project_time_entries
  await expectAccepted("time entry without task is accepted", () =>
    insertEntry({ customerId, projectId }),
  );
  await expectAccepted(
    "time entry with a task of its project is accepted",
    () => insertEntry({ customerId, projectId, taskId }),
  );
  await expectAccepted("time entry of a full day is accepted", () =>
    insertEntry({ customerId, projectId, durationMinutes: 1440 }),
  );
  for (const durationMinutes of [1455, HoursLimits.MaxEntryMinutes]) {
    await expectAccepted(
      `time entry of ${durationMinutes} minutes is accepted`,
      () => insertEntry({ customerId, projectId, durationMinutes }),
    );
  }
  for (const durationMinutes of [0, 20, HoursLimits.MaxEntryMinutes + 15]) {
    await expectRejected(
      `time entry of ${durationMinutes} minutes is rejected`,
      () => insertEntry({ customerId, projectId, durationMinutes }),
      E.DurationCheck,
    );
  }
  await expectRejected(
    "time entry with an empty description is rejected",
    () => insertEntry({ customerId, projectId, description: "  " }),
    E.DescriptionCheck,
  );
  await expectRejected(
    "time entry with a task of another project is rejected",
    () => insertEntry({ customerId, projectId, taskId: siblingTaskId }),
    E.TaskProjectForeignKey,
  );
  await expectRejected(
    "time entry on another customer's project is rejected",
    () => insertEntry({ customerId, projectId: foreignProjectId }),
    E.ProjectCustomerForeignKey,
  );
  await expectRejected(
    "time entry with version zero is rejected",
    () => insertEntry({ customerId, projectId, version: 0 }),
    E.VersionCheck,
  );
  await expectRejected(
    "time entry without billable is rejected",
    () => sql`
      INSERT INTO project_time_entries (id, customer_id, project_id, performed_on, duration_minutes,
                                        description, performed_by_member_id, version)
      VALUES (${randomUUID()}, ${customerId}, ${projectId}, '2026-10-08', 60, 'Smoke', ${memberId}, 1)
    `,
  );
  await expectRejected(
    "time entry without version is rejected",
    () => sql`
      INSERT INTO project_time_entries (id, customer_id, project_id, performed_on, duration_minutes,
                                        description, billable, performed_by_member_id)
      VALUES (${randomUUID()}, ${customerId}, ${projectId}, '2026-10-08', 60, 'Smoke', TRUE, ${memberId})
    `,
  );
}
