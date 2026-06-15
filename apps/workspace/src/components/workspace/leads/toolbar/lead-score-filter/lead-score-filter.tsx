"use client";

import { CustomSelect } from "@invessiv/ui";
import { LEAD_FILTER_ALL_VALUE } from "@/common/constants/leads/list/lead-filter-all-value";
import { LeadFilterSelectId } from "@/common/constants/leads/list/lead-filter-select-ids";
import type { LeadsToolbarDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./lead-score-filter.module.css";

type LeadScoreFilterProps = {
  activeScore: string;
  content: LeadsToolbarDictionary;
  onChangeAction: (value: string | undefined) => void;
};

export function LeadScoreFilter({
  activeScore,
  content,
  onChangeAction,
}: LeadScoreFilterProps) {
  const options = [
    { value: LEAD_FILTER_ALL_VALUE, label: content.scoreOptions.any },
    { value: "90", label: content.scoreOptions.atLeast90 },
    { value: "80", label: content.scoreOptions.atLeast80 },
    { value: "70", label: content.scoreOptions.atLeast70 },
    { value: "50", label: content.scoreOptions.atLeast50 },
  ];

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{content.filters.score}</span>
      <CustomSelect<string>
        ariaLabel={content.filters.score}
        clearLabel={content.actions.clear}
        id={LeadFilterSelectId.Score}
        onChange={(next) =>
          onChangeAction(next === LEAD_FILTER_ALL_VALUE ? undefined : next)
        }
        onClear={activeScore ? () => onChangeAction(undefined) : undefined}
        options={options}
        value={activeScore || LEAD_FILTER_ALL_VALUE}
      />
    </div>
  );
}
