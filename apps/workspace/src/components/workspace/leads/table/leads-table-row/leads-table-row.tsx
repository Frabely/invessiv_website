"use client";

import { type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CheckboxControl,
  DataTableCell,
  DataTableHeaderCell,
  DataTableRow,
} from "@invessiv/ui";
import { useNavigationContext } from "@/hooks/workspace/use-navigation-context";
import type { Locale } from "@/config/i18n";
import type { LeadActionPermissions } from "@/common/contracts/leads/lead-action-permissions";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import type { LeadSummaryDto } from "@invessiv/common/contracts/leads/lead-summary.dto";
import type {
  LeadsDeleteDictionary,
  LeadsOutreachDictionary,
  LeadsSharedDictionary,
  LeadsTableDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { buildLeadTableRowEditHref } from "@/lib/workspace/leads/lead-list-query-string";
import {
  LeadCategoryBadge,
  LeadScoreBar,
  LeadSocialProfiles,
  LeadSourceBadge,
  LeadStatusBadge,
} from "@/components/workspace/leads/shared";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { buildLeadHref, formatLeadCreatedAt } from "../lead-table-utils";
import { LeadsTableRowActions } from "../leads-table-row-actions/leads-table-row-actions";
import { useListSelection } from "@/components/workspace/shared/table/list-selection-provider/list-selection-context";
import styles from "./leads-table-row.module.css";

type LeadsTableRowProps = {
  actions: LeadActionPermissions;
  basePath: string;
  currentQueryString: string;
  currentSearchParams: Record<string, string | string[] | undefined>;
  deleteContent: LeadsDeleteDictionary;
  lead: LeadSummaryDto;
  locale: Locale;
  outreachContent?: LeadsOutreachDictionary;
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

function isInteractiveDescendant(
  target: EventTarget | null,
  container: HTMLElement,
): boolean {
  if (!(target instanceof HTMLElement) || target === container) {
    return false;
  }

  return (
    target.closest(
      "button, input, select, textarea, a[href], summary, [contenteditable='true']",
    ) !== null
  );
}

export function LeadsTableRow({
  actions,
  basePath,
  currentQueryString,
  currentSearchParams,
  deleteContent,
  lead,
  locale,
  outreachContent,
  sharedContent,
  tableContent,
}: LeadsTableRowProps) {
  const router = useRouter();
  const startTransition = useNavigationContext();
  const { isSelected, toggleRow } = useListSelection();
  const href = buildLeadHref(basePath, currentQueryString, {
    [LeadListQueryParam.Selected]: lead.id,
  });
  const editHref = buildLeadTableRowEditHref(
    basePath,
    lead.id,
    currentSearchParams,
  );
  const selected = isSelected(lead.id);
  const displayName = lead.displayName;
  const createdRelative = formatRelativeTime(
    locale,
    lead.createdAt,
    tableContent.relativeTime,
  );
  const updatedRelative = formatRelativeTime(
    locale,
    lead.updatedAt,
    tableContent.relativeTime,
  );
  const createdAbsolute = formatLeadCreatedAt(locale, lead.createdAt);
  const updatedAbsolute = formatLeadCreatedAt(locale, lead.updatedAt);
  const categoryLabel = getCategoryLabel(
    sharedContent,
    tableContent.placeholders.empty,
    lead.category?.labelKey,
  );

  function handleRowClick() {
    startTransition(() => router.push(href));
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (isInteractiveDescendant(event.target, event.currentTarget)) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startTransition(() => router.push(href));
    }
  }

  function handleCheckboxClick(event: MouseEvent<HTMLInputElement>) {
    event.stopPropagation();
  }

  return (
    <DataTableRow
      aria-label={`${tableContent.row.open}: ${displayName}`}
      className={styles.row}
      data-selected={selected ? "true" : "false"}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      mobileCard
      tabIndex={0}
      role="link"
    >
      <DataTableCell className={styles.checkboxCell} mobileCardSlot="selection">
        {actions.canWrite || actions.canDelete ? (
          <CheckboxControl
            aria-label={`${tableContent.selection.row}: ${displayName}`}
            checked={selected}
            onChange={() => toggleRow(lead.id)}
            onClick={handleCheckboxClick}
          />
        ) : null}
      </DataTableCell>

      <DataTableHeaderCell
        className={styles.leadCell}
        mobileCardSlot="primary"
        scope="row"
      >
        <div className={styles.leadText}>
          <span className={styles.leadTitle}>{displayName}</span>
          {lead.email ? (
            <span className={styles.leadEmail}>{lead.email}</span>
          ) : null}
        </div>
      </DataTableHeaderCell>

      <DataTableCell
        className={styles.categoryCell}
        mobileCardSlot="supportingSecondary"
      >
        <LeadCategoryBadge
          categoryKey={lead.category?.labelKey}
          label={categoryLabel}
        />
      </DataTableCell>

      <DataTableCell
        className={styles.stageCell}
        mobileCardSlot="supportingPrimary"
      >
        <LeadStatusBadge
          label={sharedContent.status[lead.leadStatus]}
          status={lead.leadStatus}
        />
      </DataTableCell>

      <DataTableCell className={styles.scoreCell} mobileCardSlot="detail">
        <LeadScoreBar
          ariaLabel={sharedContent.score.ariaLabel}
          score={lead.score}
        />
      </DataTableCell>

      <DataTableCell className={styles.socialCell} mobileCardSlot="secondary">
        <LeadSocialProfiles
          emptyLabel={tableContent.placeholders.empty}
          labels={sharedContent.socialIconLabel}
          phone={lead.phone}
          profiles={lead.socialProfiles}
          websiteUrl={lead.websiteUrl}
        />
      </DataTableCell>

      <DataTableCell className={styles.createdCell} title={createdAbsolute}>
        {createdRelative}
      </DataTableCell>

      <DataTableCell className={styles.updatedCell} title={updatedAbsolute}>
        {updatedRelative}
      </DataTableCell>

      <DataTableCell className={styles.sourceCell}>
        <LeadSourceBadge
          label={sharedContent.source[lead.source]}
          source={lead.source}
        />
      </DataTableCell>

      <LeadsTableRowActions
        canDelete={actions.canDelete}
        canEdit={actions.canWrite}
        deleteContent={deleteContent}
        deleteLabel={tableContent.actions.delete}
        editHref={editHref}
        editLabel={tableContent.actions.edit}
        leadCurrentStatus={lead.leadStatus}
        leadDisplayName={displayName}
        leadId={lead.id}
        menuLabel={tableContent.actions.label}
        mobileCardSlot="actions"
        outreachContent={outreachContent}
      />
    </DataTableRow>
  );
}
