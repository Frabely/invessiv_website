import type { Locale } from "@/config/i18n";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import { LeadsEmptyStateVariant } from "@/common/constants/leads/list/lead-empty-state-variants";
import { LeadSort } from "@/common/constants/leads/list/lead-sort";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";
import type {
  LeadsBulkDictionary,
  LeadsDeleteDictionary,
  LeadsOutreachDictionary,
  LeadsSharedDictionary,
  LeadsTableDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadsBulkActionBar } from "../bulk/leads-bulk-action-bar/leads-bulk-action-bar";
import { LeadsEmptyState } from "../leads-empty-state/leads-empty-state";
import { LeadsTableSelectAllCheckbox } from "../leads-table-select-all-checkbox/leads-table-select-all-checkbox";
import { LeadsTableSelectionProvider } from "../leads-table-selection-provider/leads-table-selection-provider";
import { LeadsTableRow } from "../leads-table-row/leads-table-row";
import { SortableHeader } from "../sortable-header/sortable-header";
import { LeadsTableSpinner } from "./leads-table-spinner/leads-table-spinner";
import { LEADS_TABLE_COLUMN_COUNT } from "./leads-table.constants";
import styles from "./leads-table.module.css";

type LeadsTableProps = {
  basePath: string;
  bulkContent: LeadsBulkDictionary;
  categories: LeadCategoryOption[];
  deleteContent: LeadsDeleteDictionary;
  locale: Locale;
  currentSearchParams: Record<string, string | string[] | undefined>;
  outreachContent?: LeadsOutreachDictionary;
  queryString: string;
  rows: LeadSummaryDto[];
  selectionResetKey?: string;
  emptyState?: {
    actionHref?: string;
    actionLabel: string;
    description: string;
    title: string;
    variant: LeadsEmptyStateVariant;
  };
  sharedContent: LeadsSharedDictionary;
  tableContent: LeadsTableDictionary;
};

function getActiveSort(queryString: string): string | undefined {
  const params = new URLSearchParams(queryString);
  return params.get(LeadListQueryParam.Sort) ?? undefined;
}

export function LeadsTable({
  basePath,
  bulkContent,
  categories,
  deleteContent,
  locale,
  currentSearchParams,
  outreachContent,
  queryString,
  rows,
  selectionResetKey,
  emptyState,
  sharedContent,
  tableContent,
}: LeadsTableProps) {
  const activeSort = getActiveSort(queryString);
  const rowIds = rows.map((row) => row.id);

  return (
    <section className={styles.shell} aria-label={tableContent.columns.lead}>
      <LeadsTableSelectionProvider
        rowIds={rowIds}
        selectionResetKey={selectionResetKey}
      >
        <div className={styles.tableFrame}>
          <LeadsTableSpinner ariaLabel={tableContent.loadingLabel} />
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <colgroup>
                <col className={styles.selectColumn} />
                <col className={styles.leadColumn} />
                <col className={styles.categoryColumn} />
                <col className={styles.stageColumn} />
                <col className={styles.scoreColumn} />
                <col className={styles.socialColumn} />
                <col className={styles.dateColumn} />
                <col className={styles.dateColumn} />
                <col className={styles.sourceColumn} />
                <col className={styles.actionsColumn} />
              </colgroup>
              <thead>
                <tr>
                  <th className={styles.selectHeader} scope="col">
                    <LeadsTableSelectAllCheckbox
                      ariaLabel={tableContent.selection.selectAll}
                    />
                  </th>
                  <SortableHeader
                    activeSort={activeSort}
                    ascLabel={tableContent.sort.nameAsc}
                    basePath={basePath}
                    descLabel={tableContent.sort.nameDesc}
                    label={tableContent.columns.lead}
                    queryString={queryString}
                    sortAsc={LeadSort.NameAsc}
                    sortDesc={LeadSort.NameDesc}
                  />
                  <th className={styles.header} scope="col">
                    {tableContent.columns.category}
                  </th>
                  <th className={styles.header} scope="col">
                    {tableContent.columns.stage}
                  </th>

                  <SortableHeader
                    activeSort={activeSort}
                    ascLabel={tableContent.sort.scoreAsc}
                    basePath={basePath}
                    descLabel={tableContent.sort.scoreDesc}
                    label={tableContent.columns.score}
                    queryString={queryString}
                    sortAsc={LeadSort.ScoreAsc}
                    sortDesc={LeadSort.ScoreDesc}
                  />
                  <th className={styles.header} scope="col">
                    {tableContent.columns.social}
                  </th>
                  <SortableHeader
                    activeSort={activeSort}
                    ascLabel={tableContent.sort.createdAsc}
                    basePath={basePath}
                    descLabel={tableContent.sort.createdDesc}
                    label={tableContent.columns.created}
                    queryString={queryString}
                    sortAsc={LeadSort.CreatedAsc}
                    sortDesc={LeadSort.CreatedDesc}
                  />
                  <SortableHeader
                    activeSort={activeSort}
                    ascLabel={tableContent.sort.updatedAsc}
                    basePath={basePath}
                    descLabel={tableContent.sort.updatedDesc}
                    label={tableContent.columns.updated}
                    queryString={queryString}
                    sortAsc={LeadSort.UpdatedAsc}
                    sortDesc={LeadSort.UpdatedDesc}
                  />
                  <th className={styles.header} scope="col">
                    {tableContent.columns.source}
                  </th>
                  <th className={styles.actionsHeader} scope="col">
                    <span className={styles.visuallyHidden}>
                      {tableContent.actions.label}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((lead) => (
                    <LeadsTableRow
                      basePath={basePath}
                      currentQueryString={queryString}
                      currentSearchParams={currentSearchParams}
                      deleteContent={deleteContent}
                      key={lead.id}
                      lead={lead}
                      locale={locale}
                      outreachContent={outreachContent}
                      sharedContent={sharedContent}
                      tableContent={tableContent}
                    />
                  ))
                ) : emptyState ? (
                  <tr className={styles.emptyStateRow}>
                    <td
                      className={styles.emptyStateCell}
                      colSpan={LEADS_TABLE_COLUMN_COUNT}
                    >
                      <LeadsEmptyState
                        actionHref={emptyState.actionHref}
                        actionLabel={emptyState.actionLabel}
                        description={emptyState.description}
                        title={emptyState.title}
                        variant={emptyState.variant}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        <LeadsBulkActionBar
          bulkContent={bulkContent}
          categories={categories}
          rows={rows}
          sharedContent={sharedContent}
        />
      </LeadsTableSelectionProvider>
    </section>
  );
}
