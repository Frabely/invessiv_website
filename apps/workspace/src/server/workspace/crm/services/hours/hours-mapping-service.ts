import type { HourAllocationDto } from "@invessiv/common/contracts/crm/hours/hour-allocation.dto";
import type { HourPurchaseDto } from "@invessiv/common/contracts/crm/hours/hour-purchase.dto";
import type { HourAllocationRow } from "@invessiv/common/contracts/crm/rows/hour-allocation-row";
import type { HourPurchaseRow } from "@invessiv/common/contracts/crm/rows/hour-purchase-row";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import type { TimeEntryRow } from "@invessiv/common/contracts/crm/rows/time-entry-row";

function toPurchaseDto(row: HourPurchaseRow): HourPurchaseDto {
  return {
    id: row.id,
    kind: row.kind,
    source: row.source,
    minutes: row.minutes,
    purchasedOn: row.purchased_on,
    note: row.note,
    createdByMemberId: row.created_by_member_id,
    createdAt: row.created_at.toISOString(),
  };
}

function toAllocationDto(row: HourAllocationRow): HourAllocationDto {
  return {
    id: row.id,
    projectId: row.project_id,
    minutes: row.minutes,
    note: row.note,
    createdByMemberId: row.created_by_member_id,
    createdAt: row.created_at.toISOString(),
  };
}

function toTimeEntryDto(row: TimeEntryRow): TimeEntryDto {
  return {
    id: row.id,
    projectId: row.project_id,
    taskId: row.task_id,
    performedOn: row.performed_on,
    durationMinutes: row.duration_minutes,
    description: row.description,
    billable: row.billable,
    performedByMemberId: row.performed_by_member_id,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const hoursMappingService = {
  toPurchaseDto,
  toAllocationDto,
  toTimeEntryDto,
} as const;
