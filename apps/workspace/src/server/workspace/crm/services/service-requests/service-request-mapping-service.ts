import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { ServiceRequestJoinedRow } from "./service-request-types";
function toDto(
  row: ServiceRequestJoinedRow,
  requestedByName: string,
): ServiceRequestDto {
  const r = row.request;
  return {
    id: r.id,
    customerId: r.customer_id,
    customerDisplayName: row.customerDisplayName,
    customerNumber: row.customerNumber,
    lineItemTemplateId: r.line_item_template_id,
    kind: r.kind,
    title: r.title,
    note: r.note,
    requestedMinutes: r.requested_minutes,
    projectWish: r.project_wish,
    requestedProjectId: r.requested_project_id,
    requestedProjectTitle: row.requestedProjectTitle,
    requestedByName,
    status: r.status,
    declineReason: r.decline_reason,
    offeredAt: r.offered_at?.toISOString() ?? null,
    offeredPriceCents: r.offered_price_cents,
    offeredPricingMode: r.offered_pricing_mode,
    offeredRecurringInterval: r.offered_recurring_interval,
    offeredMinutes: r.offered_minutes,
    decidedAt: r.decided_at?.toISOString() ?? null,
    projectId: r.project_id,
    projectLineItemId: r.project_line_item_id,
    version: r.version,
    createdAt: r.created_at.toISOString(),
  };
}
export const serviceRequestMappingService = { toDto } as const;
