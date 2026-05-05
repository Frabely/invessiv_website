import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";
import type { LeadSummaryRow } from "@/common/contracts/leads/rows/lead-summary-row";
import { mapCategoryRowToDto } from "@/server/workspace/leads/services/lead-category/lead-category-mapping-service";

export function mapLeadRowToSummaryDto(row: LeadSummaryRow): LeadSummaryDto {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    companyName: row.company_name,
    email: row.email,
    websiteUrl: row.website_url,
    score: row.score,
    source: row.source,
    leadStatus: row.lead_status,
    owner: row.owner,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    category: mapCategoryRowToDto(row),
  };
}
