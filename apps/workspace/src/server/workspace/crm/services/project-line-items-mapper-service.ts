import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { ProjectLineItemRow } from "@invessiv/common/contracts/crm/rows/project-line-item-row";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";

function toDto(row: ProjectLineItemRow): ProjectLineItemDto {
  return {
    id: row.id,
    projectId: row.project_id,
    sourceLineItemTemplateId: row.source_line_item_template_id,
    title: row.title,
    description: row.description,
    priceCents: row.price_cents,
    pricingMode: row.pricing_mode,
    recurringInterval: row.recurring_interval,
    status: row.status ?? ProjectLineItemStatus.Confirmed,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const projectLineItemsMapperService = { toDto } as const;
