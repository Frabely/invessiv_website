import {
  LEAD_PROFILE_TYPE_VALUES,
  type LeadProfileType,
} from "@/common/constants/leads/profile/lead-profile-types";
import { ProfileFilterState } from "@/common/constants/leads/profile/profile-filter-state";
import type { ProfileFilterSelection } from "@/common/contracts/leads/profile-filter-selection";

export function parseProfileTypeCsv(
  raw: string | undefined | null,
): LeadProfileType[] {
  if (!raw) {
    return [];
  }

  const validValues = LEAD_PROFILE_TYPE_VALUES as readonly string[];
  const seen = new Set<string>();
  const result: LeadProfileType[] = [];

  for (const part of raw.split(",")) {
    const value = part.trim();
    if (!value || seen.has(value) || !validValues.includes(value)) {
      continue;
    }

    seen.add(value);
    result.push(value as LeadProfileType);
  }

  return result;
}

export function readProfileFilterSelection(
  includeRaw: string | undefined | null,
  excludeRaw: string | undefined | null,
): ProfileFilterSelection {
  return {
    include: parseProfileTypeCsv(includeRaw),
    exclude: parseProfileTypeCsv(excludeRaw),
  };
}

export function getProfileFilterState(
  selection: ProfileFilterSelection,
  profileType: LeadProfileType,
): ProfileFilterState {
  if (selection.include.includes(profileType)) {
    return ProfileFilterState.Include;
  }

  if (selection.exclude.includes(profileType)) {
    return ProfileFilterState.Exclude;
  }

  return ProfileFilterState.Inactive;
}

function nextProfileFilterState(state: ProfileFilterState): ProfileFilterState {
  if (state === ProfileFilterState.Inactive) {
    return ProfileFilterState.Include;
  }

  if (state === ProfileFilterState.Include) {
    return ProfileFilterState.Exclude;
  }

  return ProfileFilterState.Inactive;
}

export function cycleProfileFilter(
  selection: ProfileFilterSelection,
  profileType: LeadProfileType,
): ProfileFilterSelection {
  const target = nextProfileFilterState(
    getProfileFilterState(selection, profileType),
  );

  const include = selection.include.filter((type) => type !== profileType);
  const exclude = selection.exclude.filter((type) => type !== profileType);

  if (target === ProfileFilterState.Include) {
    include.push(profileType);
  } else if (target === ProfileFilterState.Exclude) {
    exclude.push(profileType);
  }

  return { include, exclude };
}

export function serializeProfileFilterList(
  list: readonly LeadProfileType[],
): string | undefined {
  return list.length > 0 ? list.join(",") : undefined;
}
