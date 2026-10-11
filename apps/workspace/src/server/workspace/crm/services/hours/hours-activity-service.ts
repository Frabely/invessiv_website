import "server-only";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { HourAllocationRow } from "@invessiv/common/contracts/crm/rows/hour-allocation-row";
import type { HourPurchaseRow } from "@invessiv/common/contracts/crm/rows/hour-purchase-row";
import type { TimeEntryRow } from "@invessiv/common/contracts/crm/rows/time-entry-row";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  HOUR_ALLOCATION_ACTIVITY_ENTITY,
  HOUR_PURCHASE_ACTIVITY_ENTITY,
  TIME_ENTRY_ACTIVITY_ENTITY,
  TimeEntryActivityField,
} from "@/common/constants/crm/hours-activity-metadata";
import { activityService } from "@/server/shared/services/activity-service";

/**
 * Activities carry ids and minutes, never the note: the free text must not be copied into an
 * append-only log. Both ledger rows are immutable, so `created` is the only event they ever get.
 */
async function recordPurchase(
  tx: ContactDatabaseTransaction,
  row: HourPurchaseRow,
  actor: ActivityActor,
): Promise<void> {
  await activityService.createActivity(tx, {
    customerId: row.customer_id,
    actor,
    type: ActivityType.Created,
    metadata: {
      entity: HOUR_PURCHASE_ACTIVITY_ENTITY,
      hour_purchase_id: row.id,
      kind: row.kind,
      minutes: row.minutes,
    },
  });
}

async function recordAllocation(
  tx: ContactDatabaseTransaction,
  row: HourAllocationRow,
  actor: ActivityActor,
): Promise<void> {
  await activityService.createActivity(tx, {
    customerId: row.customer_id,
    projectId: row.project_id,
    actor,
    type: ActivityType.Created,
    metadata: {
      entity: HOUR_ALLOCATION_ACTIVITY_ENTITY,
      hour_allocation_id: row.id,
      minutes: row.minutes,
    },
  });
}

function timeEntryInput(row: TimeEntryRow, actor: ActivityActor) {
  return {
    customerId: row.customer_id,
    projectId: row.project_id,
    actor,
  } as const;
}

async function recordTimeEntryCreated(
  tx: ContactDatabaseTransaction,
  row: TimeEntryRow,
  actor: ActivityActor,
): Promise<void> {
  await activityService.createActivity(tx, {
    ...timeEntryInput(row, actor),
    type: ActivityType.Created,
    metadata: {
      entity: TIME_ENTRY_ACTIVITY_ENTITY,
      time_entry_id: row.id,
      duration_minutes: row.duration_minutes,
      billable: row.billable,
    },
  });
}

/** One activity per changed field; an edit that changes nothing writes none. */
async function recordTimeEntryChanged(
  tx: ContactDatabaseTransaction,
  previous: TimeEntryRow,
  next: TimeEntryRow,
  actor: ActivityActor,
): Promise<void> {
  const fields = [
    [
      TimeEntryActivityField.Duration,
      previous.duration_minutes,
      next.duration_minutes,
    ],
    [
      TimeEntryActivityField.PerformedOn,
      previous.performed_on,
      next.performed_on,
    ],
    [TimeEntryActivityField.Billable, previous.billable, next.billable],
    [TimeEntryActivityField.Task, previous.task_id, next.task_id],
  ] as const;

  for (const [field, before, after] of fields) {
    if (before === after) continue;
    await activityService.createActivity(tx, {
      ...timeEntryInput(next, actor),
      type: ActivityType.FieldChange,
      metadata: {
        entity: TIME_ENTRY_ACTIVITY_ENTITY,
        time_entry_id: next.id,
        field,
        previous: before,
        next: after,
      },
    });
  }
  if (previous.description !== next.description) {
    await activityService.createActivity(tx, {
      ...timeEntryInput(next, actor),
      type: ActivityType.FieldChange,
      metadata: {
        entity: TIME_ENTRY_ACTIVITY_ENTITY,
        time_entry_id: next.id,
        field: TimeEntryActivityField.Description,
      },
    });
  }
}

/** The row is gone afterwards, so the figures that mattered are kept with the event. */
async function recordTimeEntryDeleted(
  tx: ContactDatabaseTransaction,
  row: TimeEntryRow,
  actor: ActivityActor,
): Promise<void> {
  await activityService.createActivity(tx, {
    ...timeEntryInput(row, actor),
    type: ActivityType.FieldChange,
    metadata: {
      entity: TIME_ENTRY_ACTIVITY_ENTITY,
      time_entry_id: row.id,
      field: TimeEntryActivityField.Deleted,
      previous: {
        duration_minutes: row.duration_minutes,
        performed_on: row.performed_on,
        billable: row.billable,
      },
    },
  });
}

export const hoursActivityService = {
  recordPurchase,
  recordAllocation,
  recordTimeEntryCreated,
  recordTimeEntryChanged,
  recordTimeEntryDeleted,
} as const;
