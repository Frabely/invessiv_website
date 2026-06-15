"use client";

import { LeadFilterSelectId } from "@/common/constants/leads/list/lead-filter-select-ids";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import type { LeadsToolbarDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadCategoryBadge } from "@/components/workspace/leads/shared";
import { LeadFacetFilter } from "../lead-facet-filter/lead-facet-filter";

type LeadCategoryFilterProps = {
  activeCategory: string | undefined;
  categories: LeadCategoryOption[];
  content: LeadsToolbarDictionary;
  onChangeAction: (value: string | undefined) => void;
};

export function LeadCategoryFilter({
  activeCategory,
  categories,
  content,
  onChangeAction,
}: LeadCategoryFilterProps) {
  return (
    <LeadFacetFilter
      activeValue={activeCategory}
      allOption={{
        chip: <LeadCategoryBadge label={content.filters.allCategories} />,
        selectLabel: content.filters.allCategories,
      }}
      ariaLabel={content.filters.category}
      clearLabel={content.actions.clear}
      label={content.filters.category}
      onChangeAction={onChangeAction}
      options={categories.map((category) => ({
        value: category.id,
        chip: (
          <LeadCategoryBadge
            categoryKey={category.labelKey}
            label={category.label}
          />
        ),
        selectLabel: category.label,
      }))}
      selectId={LeadFilterSelectId.Category}
    />
  );
}
