import type { LeadCategoryDto } from "@invessiv/common/contracts/leads/lead-category.dto";
import type { LeadCategoryRow } from "@invessiv/common/contracts/leads/rows/lead-category-row";

export function mapCategoryRowToDto(
  row: LeadCategoryRow,
): LeadCategoryDto | null {
  if (
    row.category_id === null ||
    row.category_slug === null ||
    row.category_label_key === null
  ) {
    return null;
  }
  return {
    id: row.category_id,
    slug: row.category_slug,
    labelKey: row.category_label_key,
  };
}
