import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";
import type { ServiceTemplateRow } from "@invessiv/common/contracts/crm/rows/service-template-row";

function toDto(row: ServiceTemplateRow): ServiceTemplateDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceCents: row.price_cents,
    pricingMode: row.pricing_mode,
    recurringInterval: row.recurring_interval,
    status: row.status,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const serviceTemplatesMapperService = { toDto } as const;
