import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { LineItemTemplateRow } from "@invessiv/common/contracts/crm/rows/line-item-template-row";

/** Rows written before Task 74 carry NULL in the four newer columns; NULL reads as the plain value. */
function toDto(row: LineItemTemplateRow): LineItemTemplateDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceCents: row.price_cents,
    pricingMode: row.pricing_mode,
    recurringInterval: row.recurring_interval,
    kind: row.kind ?? LineItemKind.Standard,
    projectMode: row.project_mode ?? LineItemProjectMode.ExistingProject,
    portalRequestable: row.portal_requestable ?? false,
    portalDescription: row.portal_description ?? "",
    status: row.status,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const lineItemTemplatesMapperService = { toDto } as const;
