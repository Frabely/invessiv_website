"use client";

import { CONTACT_LEAD_STATUS_VALUES } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadFilterSelectId } from "@/common/constants/leads/list/lead-filter-select-ids";
import type {
  LeadsSharedDictionary,
  LeadsToolbarDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadStatusBadge } from "@/components/workspace/leads/shared";
import { LeadFacetFilter } from "../lead-facet-filter/lead-facet-filter";

type LeadStatusFilterProps = {
  activeStatus: string | undefined;
  content: LeadsToolbarDictionary;
  onChangeAction: (value: string | undefined) => void;
  sharedContent: LeadsSharedDictionary;
};

export function LeadStatusFilter({
  activeStatus,
  content,
  onChangeAction,
  sharedContent,
}: LeadStatusFilterProps) {
  const activeValue =
    activeStatus && CONTACT_LEAD_STATUS_VALUES.includes(activeStatus as never)
      ? activeStatus
      : undefined;

  return (
    <LeadFacetFilter
      activeValue={activeValue}
      allOption={{
        chip: <LeadStatusBadge label={content.tabs.all} status="all" />,
        selectLabel: content.filters.allStatuses,
      }}
      ariaLabel={content.filters.status}
      clearLabel={content.actions.clear}
      label={content.filters.status}
      onChangeAction={onChangeAction}
      options={CONTACT_LEAD_STATUS_VALUES.map((status) => ({
        value: status,
        chip: (
          <LeadStatusBadge
            label={sharedContent.status[status]}
            status={status}
          />
        ),
        selectLabel: sharedContent.status[status],
      }))}
      selectId={LeadFilterSelectId.Status}
    />
  );
}
