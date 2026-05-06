"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/config/i18n";
import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";
import type {
  LeadsSharedDictionary,
  LeadsTableDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import {
  LeadScoreBar,
  LeadSourceBadge,
  LeadStatusBadge,
} from "@/components/workspace/leads/shared";
import {
  buildLeadHref,
  formatLeadCreatedAt,
  getLeadDisplayName,
  getLeadInitials,
  getLeadSecondaryLabel,
} from "../lead-table-utils";
import { useLeadsTableSelection } from "../leads-table-selection-provider/leads-table-selection-context";
import styles from "./leads-table-row.module.css";

type LeadsTableRowProps = {
  basePath: string;
  currentQueryString: string;
  lead: LeadSummaryDto;
  locale: Locale;
  sharedContent: LeadsSharedDictionary;
  tableContent: LeadsTableDictionary;
};

function getCategoryLabel(
  sharedContent: LeadsSharedDictionary,
  emptyLabel: string,
  labelKey: string | undefined,
) {
  if (!labelKey) {
    return emptyLabel;
  }

  if (labelKey in sharedContent.category) {
    return sharedContent.category[
      labelKey as keyof typeof sharedContent.category
    ];
  }

  return labelKey;
}

export function LeadsTableRow({
  basePath,
  currentQueryString,
  lead,
  locale,
  sharedContent,
  tableContent,
}: LeadsTableRowProps) {
  const router = useRouter();
  const { isSelected, toggleRow } = useLeadsTableSelection();
  const href = buildLeadHref(basePath, currentQueryString, {
    selected: lead.id,
  });
  const selected = isSelected(lead.id);
  const displayName = getLeadDisplayName(lead);
  const initials = getLeadInitials(lead);
  const secondaryLabel = getLeadSecondaryLabel(lead);
  const createdAt = formatLeadCreatedAt(locale, lead.createdAt);
  const categoryLabel = getCategoryLabel(
    sharedContent,
    tableContent.placeholders.empty,
    lead.category?.labelKey,
  );

  function handleRowClick() {
    router.push(href);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(href);
    }
  }

  function handleCheckboxClick(event: MouseEvent<HTMLInputElement>) {
    event.stopPropagation();
  }

  return (
    <tr
      aria-label={`${tableContent.row.open}: ${displayName}`}
      className={styles.row}
      data-selected={selected ? "true" : "false"}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      tabIndex={0}
      role="link"
    >
      <td className={styles.checkboxCell}>
        <label className={styles.checkbox}>
          <input
            aria-label={`${tableContent.selection.row}: ${displayName}`}
            checked={selected}
            className={styles.checkboxInput}
            onChange={() => toggleRow(lead.id)}
            onClick={handleCheckboxClick}
            type="checkbox"
          />
          <span aria-hidden="true" className={styles.checkboxBox} />
        </label>
      </td>

      <td className={styles.leadCell}>
        <div aria-hidden="true" className={styles.avatar}>
          {initials}
        </div>
        <div className={styles.leadText}>
          <div className={styles.leadTitleRow}>
            <span className={styles.leadTitle}>{displayName}</span>
            <span className={styles.leadMeta}>{secondaryLabel}</span>
          </div>
          <span className={styles.leadUrl}>
            {lead.websiteUrl ?? lead.email}
          </span>
        </div>
      </td>

      <td className={styles.categoryCell}>{categoryLabel}</td>

      <td className={styles.stageCell}>
        <LeadStatusBadge
          label={sharedContent.status[lead.leadStatus]}
          status={lead.leadStatus}
        />
      </td>

      <td className={styles.scoreCell}>
        <LeadScoreBar
          ariaLabel={sharedContent.score.ariaLabel}
          score={lead.score}
        />
      </td>

      <td className={styles.createdCell}>{createdAt}</td>

      <td className={styles.sourceCell}>
        <LeadSourceBadge
          label={sharedContent.source[lead.source]}
          source={lead.source}
        />
      </td>
    </tr>
  );
}
