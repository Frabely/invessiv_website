import type { Locale } from "@/config/i18n";
import { LeadSort } from "@/common/constants/leads/lead-sort";
import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";
import type {
  LeadsSharedDictionary,
  LeadsTableDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadsTableSelectAllCheckbox } from "../leads-table-select-all-checkbox/leads-table-select-all-checkbox";
import { LeadsTableSelectionProvider } from "../leads-table-selection-provider/leads-table-selection-provider";
import { LeadsTableRow } from "../leads-table-row/leads-table-row";
import { SortableHeader } from "../sortable-header/sortable-header";
import styles from "./leads-table.module.css";

type LeadsTableProps = {
  basePath: string;
  locale: Locale;
  queryString: string;
  rows: LeadSummaryDto[];
  sharedContent: LeadsSharedDictionary;
  tableContent: LeadsTableDictionary;
};

function getActiveSort(queryString: string): string | undefined {
  const params = new URLSearchParams(queryString);
  return params.get("sort") ?? undefined;
}

export function LeadsTable({
  basePath,
  locale,
  queryString,
  rows,
  sharedContent,
  tableContent,
}: LeadsTableProps) {
  const activeSort = getActiveSort(queryString);
  const rowIds = rows.map((row) => row.id);

  return (
    <section className={styles.shell} aria-label={tableContent.columns.lead}>
      <LeadsTableSelectionProvider rowIds={rowIds}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
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
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <LeadsTableRow
                  basePath={basePath}
                  currentQueryString={queryString}
                  key={lead.id}
                  lead={lead}
                  locale={locale}
                  sharedContent={sharedContent}
                  tableContent={tableContent}
                />
              ))}
            </tbody>
          </table>
        </div>
      </LeadsTableSelectionProvider>
    </section>
  );
}
