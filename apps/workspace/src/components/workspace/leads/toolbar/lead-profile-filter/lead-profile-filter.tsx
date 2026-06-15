"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faPhone } from "@fortawesome/free-solid-svg-icons";
import {
  faInstagram,
  faLinkedinIn,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { CustomSelect } from "@invessiv/ui";
import { TriState } from "@invessiv/common/constants/filters/tri-state";
import {
  LEAD_PROFILE_TYPE_VALUES,
  LeadProfileType,
  type LeadProfileType as LeadProfileTypeValue,
} from "@/common/constants/leads/profile/lead-profile-types";
import { LeadFilterSelectId } from "@/common/constants/leads/list/lead-filter-select-ids";
import { ProfileFilterState } from "@/common/constants/leads/profile/profile-filter-state";
import type { ProfileFilterSelection } from "@/common/contracts/leads/profile-filter-selection";
import { getProfileFilterState } from "@/lib/workspace/leads/lead-profile-filter";
import type { LeadsToolbarDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./lead-profile-filter.module.css";

type LeadProfileFilterProps = {
  content: LeadsToolbarDictionary;
  onClearAction: () => void;
  onCycleAction: (profileType: LeadProfileTypeValue) => void;
  selection: ProfileFilterSelection;
};

const PROFILE_TYPE_ICONS: Record<LeadProfileTypeValue, IconDefinition> = {
  [LeadProfileType.Website]: faGlobe,
  [LeadProfileType.Phone]: faPhone,
  [LeadProfileType.Linkedin]: faLinkedinIn,
  [LeadProfileType.Instagram]: faInstagram,
  [LeadProfileType.Youtube]: faYoutube,
};

const PROFILE_STATE_TO_TRI_STATE: Record<ProfileFilterState, TriState> = {
  [ProfileFilterState.Inactive]: TriState.Off,
  [ProfileFilterState.Include]: TriState.Include,
  [ProfileFilterState.Exclude]: TriState.Exclude,
};

export function LeadProfileFilter({
  content,
  onClearAction,
  onCycleAction,
  selection,
}: LeadProfileFilterProps) {
  const hasProfileFilters =
    selection.include.length > 0 || selection.exclude.length > 0;

  function getStateLabel(state: ProfileFilterState) {
    if (state === ProfileFilterState.Include) {
      return content.profiles.included;
    }

    if (state === ProfileFilterState.Exclude) {
      return content.profiles.excluded;
    }

    return undefined;
  }

  return (
    <div className={styles.group}>
      <span className={styles.fieldLabel}>{content.profiles.label}</span>

      <div
        aria-label={content.profiles.label}
        className={styles.chipRow}
        role="toolbar"
      >
        {LEAD_PROFILE_TYPE_VALUES.map((profileType) => {
          const state = getProfileFilterState(selection, profileType);
          const typeLabel = content.profiles.types[profileType];
          const stateLabel = getStateLabel(state);

          return (
            <button
              aria-label={
                stateLabel ? `${typeLabel}: ${stateLabel}` : typeLabel
              }
              aria-pressed={state !== ProfileFilterState.Inactive}
              className={styles.profileChip}
              data-profile-type={profileType}
              data-state={state}
              key={`profile-${profileType}`}
              onClick={() => onCycleAction(profileType)}
              title={content.profiles.hint}
              type="button"
            >
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.profileChipIcon}
                icon={PROFILE_TYPE_ICONS[profileType]}
              />
              <span className={styles.profileChipLabel}>{typeLabel}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.selectSlot}>
        <CustomSelect
          ariaLabel={content.profiles.label}
          clearLabel={content.actions.clear}
          id={LeadFilterSelectId.Profile}
          multiple
          onClear={hasProfileFilters ? onClearAction : undefined}
          onToggleOption={(value) => onCycleAction(value)}
          options={LEAD_PROFILE_TYPE_VALUES.map((profileType) => {
            const state = getProfileFilterState(selection, profileType);
            const typeLabel = content.profiles.types[profileType];
            const stateLabel = getStateLabel(state);

            return {
              value: profileType,
              label: typeLabel,
              ariaLabel: stateLabel ? `${typeLabel}: ${stateLabel}` : typeLabel,
              state: PROFILE_STATE_TO_TRI_STATE[state],
              leading: (
                <span
                  className={styles.profileOptionIcon}
                  data-profile-type={profileType}
                >
                  <FontAwesomeIcon
                    aria-hidden="true"
                    icon={PROFILE_TYPE_ICONS[profileType]}
                  />
                </span>
              ),
            };
          })}
          triggerLabel={content.profiles.label}
        />
      </div>
    </div>
  );
}
