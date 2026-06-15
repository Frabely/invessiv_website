"use client";

import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import {
  LEAD_SOURCES_VALUES,
  type LeadSource,
} from "@invessiv/common/constants/leads/sources/lead-sources";
import { LeadFilterSelectId } from "@/common/constants/leads/list/lead-filter-select-ids";
import type {
  LeadsSharedDictionary,
  LeadsToolbarDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import {
  LeadBadge,
  LeadSourceBadge,
} from "@/components/workspace/leads/shared";
import { LeadFacetFilter } from "../lead-facet-filter/lead-facet-filter";

type LeadSourceFilterProps = {
  activeSource: string | undefined;
  content: LeadsToolbarDictionary;
  onChangeAction: (value: string | undefined) => void;
  sharedContent: LeadsSharedDictionary;
};

function getSourceLabel(
  sharedContent: LeadsSharedDictionary,
  source: LeadSource,
) {
  if (source in sharedContent.source) {
    return sharedContent.source[source as keyof typeof sharedContent.source];
  }

  return source;
}

export function LeadSourceFilter({
  activeSource,
  content,
  onChangeAction,
  sharedContent,
}: LeadSourceFilterProps) {
  return (
    <LeadFacetFilter
      activeValue={activeSource}
      allOption={{
        chip: (
          <LeadBadge
            icon={faLayerGroup}
            kind="source"
            label={content.filters.allSources}
            tone="neutral"
          />
        ),
        selectLabel: content.filters.allSources,
      }}
      ariaLabel={content.filters.source}
      clearLabel={content.actions.clear}
      label={content.filters.source}
      onChangeAction={onChangeAction}
      options={LEAD_SOURCES_VALUES.map((source) => ({
        value: source,
        chip: (
          <LeadSourceBadge
            label={getSourceLabel(sharedContent, source)}
            source={source}
          />
        ),
        selectLabel: getSourceLabel(sharedContent, source),
      }))}
      selectId={LeadFilterSelectId.Source}
    />
  );
}
