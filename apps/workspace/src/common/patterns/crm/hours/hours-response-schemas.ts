import { z } from "zod";
import { HOUR_PURCHASE_KIND_VALUES } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HOUR_PURCHASE_SOURCE_VALUES } from "@invessiv/common/constants/crm/hour-purchase-sources";
import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";
import type { HourPurchaseDto } from "@invessiv/common/contracts/crm/hours/hour-purchase.dto";
import type { HourAllocationDto } from "@invessiv/common/contracts/crm/hours/hour-allocation.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import type { TimeEntryPageDto } from "@invessiv/common/contracts/crm/hours/time-entry-page.dto";

export const customerHoursBalanceSchema = z.object({
  purchasedMinutes: z.number(),
  allocatedMinutes: z.number(),
  freeMinutes: z.number(),
  usedMinutes: z.number(),
  goodwillMinutes: z.number(),
  remainingMinutes: z.number(),
}) satisfies z.ZodType<CustomerHoursBalanceDto>;

export const projectHoursBalanceSchema = z.object({
  projectId: z.string(),
  allocatedMinutes: z.number(),
  usedMinutes: z.number(),
  goodwillMinutes: z.number(),
  remainingMinutes: z.number(),
  releasableMinutes: z.number(),
}) satisfies z.ZodType<ProjectHoursBalanceDto>;

const hourPurchaseSchema = z.object({
  id: z.string(),
  kind: z.enum(HOUR_PURCHASE_KIND_VALUES),
  source: z.enum(HOUR_PURCHASE_SOURCE_VALUES),
  minutes: z.number(),
  purchasedOn: z.string(),
  note: z.string(),
  createdByMemberId: z.string(),
  createdAt: z.string(),
}) satisfies z.ZodType<HourPurchaseDto>;

const hourAllocationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  minutes: z.number(),
  note: z.string(),
  createdByMemberId: z.string(),
  createdAt: z.string(),
}) satisfies z.ZodType<HourAllocationDto>;

export const timeEntrySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  taskId: z.string().nullable(),
  performedOn: z.string(),
  durationMinutes: z.number(),
  description: z.string(),
  billable: z.boolean(),
  performedByMemberId: z.string(),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<TimeEntryDto>;

export const hourPurchaseResponseSchema = z.object({
  purchase: hourPurchaseSchema,
  balance: customerHoursBalanceSchema,
});

export const hourAllocationResponseSchema = z.object({
  allocation: hourAllocationSchema,
  balance: customerHoursBalanceSchema,
  project: projectHoursBalanceSchema,
});

export const timeEntryWriteResponseSchema = z.object({
  timeEntry: timeEntrySchema,
  project: projectHoursBalanceSchema,
});

export const timeEntryDeleteResponseSchema = z.object({
  deleted: z.literal(true),
  project: projectHoursBalanceSchema,
});

export const timeEntryPageSchema = z.object({
  entries: z.array(timeEntrySchema),
  nextCursor: z.string().nullable(),
}) satisfies z.ZodType<TimeEntryPageDto>;
