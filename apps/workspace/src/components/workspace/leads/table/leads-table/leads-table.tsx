import type { Locale } from "@/config/i18n";
import type { LeadActionPermissions } from "@/common/contracts/leads/lead-action-permissions";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import { LeadsEmptyStateVariant } from "@invessiv/common/constants/leads/list/lead-empty-state-variants";
import { LeadSort } from "@invessiv/common/constants/leads/list/lead-sort";
import type { LeadCategoryOption } from "@invessiv/common/contracts/leads/lead-category-option";
import type { LeadSummaryDto } from "@invessiv/common/contracts/leads/lead-summary.dto";
import type { ListLeadsResult } from "@invessiv/common/contracts/leads/results/list-leads-result";
import { DataTableLayout, type ListPaginationProps } from "@invessiv/ui";
import type {
  LeadsBulkDictionary,
  LeadsDeleteDictionary,
  LeadsOutreachDictionary,
  LeadsSharedDictionary,
  LeadsTableDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { getLeadsPaginationDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadsBulkActionBar } from "../bulk/leads-bulk-action-bar/leads-bulk-action-bar";
import { ListEmptyState } from "@/components/workspace/shared/table/list-empty-state/list-empty-state";
import { ListSelectAllCheckbox } from "@/components/workspace/shared/table/list-select-all-checkbox/list-select-all-checkbox";
import { ListSelectionProvider } from "@/components/workspace/shared/table/list-selection-provider/list-selection-provider";
import { WorkspaceScrollableTableArea } from "@/components/workspace/shared/workspace-scrollable-table-area/workspace-scrollable-table-area";
import { LeadsTableRow } from "../leads-table-row/leads-table-row";
import { SortableHeader } from "@/components/workspace/shared/table/sortable-header/sortable-header";
import { LeadsTableSpinner } from "./leads-table-spinner/leads-table-spinner";
import { LEADS_TABLE_COLUMN_COUNT } from "./leads-table.constants";
import styles from "./leads-table.module.css";

type LeadsTableProps = {
  actions: LeadActionPermissions;
  basePath: string;
  bulkContent: LeadsBulkDictionary;
  categories: LeadCategoryOption[];
  deleteContent: LeadsDeleteDictionary;
  locale: Locale;
  currentSearchParams: Record<string, string | string[] | undefined>;
  outreachContent?: LeadsOutreachDictionary;
  queryString: string;
  leadList: ListLeadsResult;
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
  actions,
  basePath,
  bulkContent,
  categories,
  deleteContent,
  locale,
  currentSearchParams,
  outreachContent,
  queryString,
  leadList,
  selectionResetKey,
  emptyState,
  sharedContent,
  tableContent,
}: LeadsTableProps) {
  const rows: LeadSummaryDto[] = leadList.rows;
  const activeSort = getActiveSort(queryString);
  const rowIds = rows.map((row) => row.id);
  const pagination: ListPaginationProps = {
    basePath,
    content: getLeadsPaginationDictionary(locale).pagination,
    currentPage: leadList.page,
    perPage: leadList.perPage,
    queryString,
    total: leadList.total,
  };
  const columns = [
    {
      header:
        actions.canWrite || actions.canDelete ? (
          <ListSelectAllCheckbox ariaLabel={tableContent.selection.selectAll} />
        ) : null,
      headerClassName: styles.selectHeader,
      id: "selection",
      width: 52,
    },
    {
      header: (
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
      ),
      id: "lead",
      width: 300,
    },
    {
      header: tableContent.columns.category,
      headerClassName: styles.header,
      id: "category",
      width: 220,
    },
    {
      header: tableContent.columns.stage,
      headerClassName: styles.header,
      id: "stage",
      width: 220,
    },
    {
      header: (
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
      ),
      id: "score",
      width: 160,
    },
    {
      header: tableContent.columns.social,
      headerClassName: styles.header,
      id: "social",
      width: 180,
    },
    {
      header: (
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
      ),
      id: "created",
      width: 150,
    },
    {
      header: (
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
      ),
      id: "updated",
      width: 150,
    },
    {
      header: tableContent.columns.source,
      headerClassName: styles.header,
      id: "source",
      width: 205,
    },
    {
      header: tableContent.actions.label,
      id: "actions",
      isPinned: true,
      isVisuallyHidden: true,
      width: 128,
    },
  ];

  return (
    <WorkspaceScrollableTableArea aria-label={tableContent.columns.lead}>
      <ListSelectionProvider
        rowIds={rowIds}
        selectionResetKey={selectionResetKey}
      >
        <DataTableLayout
          ariaLabel={tableContent.columns.lead}
          caption={tableContent.columns.lead}
          columns={columns}
          fillAvailableHeight
          pagination={pagination}
          overlay={<LeadsTableSpinner ariaLabel={tableContent.loadingLabel} />}
          scrollClassName={styles.tableScroll}
          tableClassName={styles.table}
        >
          {rows.length > 0 ? (
            rows.map((lead) => (
              <LeadsTableRow
                actions={actions}
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
                <ListEmptyState
                  actionHref={emptyState.actionHref}
                  actionLabel={emptyState.actionLabel}
                  description={emptyState.description}
                  title={emptyState.title}
                  variant={emptyState.variant}
                />
              </td>
            </tr>
          ) : null}
        </DataTableLayout>
        <LeadsBulkActionBar
          actions={actions}
          bulkContent={bulkContent}
          categories={categories}
          rows={rows}
          sharedContent={sharedContent}
        />
      </ListSelectionProvider>
    </WorkspaceScrollableTableArea>
  );
}
