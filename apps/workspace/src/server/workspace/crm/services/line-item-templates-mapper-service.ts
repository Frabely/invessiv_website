import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { LineItemTemplateRow } from "@invessiv/common/contracts/crm/rows/line-item-template-row";

function toDto(row: LineItemTemplateRow): LineItemTemplateDto {
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

export const lineItemTemplatesMapperService = { toDto } as const;
