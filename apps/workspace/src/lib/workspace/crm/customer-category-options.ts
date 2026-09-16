import type { LeadCategoryDto } from "@invessiv/common/contracts/leads/lead-category.dto";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import type { LeadsSharedDictionary } from "@/i18n/dictionaries/workspace/leads";

/** Labels come from the leads dictionary via `label_key`, never from the database text. */
export function resolveCustomerCategoryOptions(
  categories: LeadCategoryDto[],
  sharedContent: LeadsSharedDictionary,
): LeadCategoryOption[] {
  return categories.map((category) => ({
    id: category.id,
    labelKey: category.labelKey,
    label:
      sharedContent.category[
        category.labelKey as keyof typeof sharedContent.category
      ] ?? category.labelKey,
  }));
}
