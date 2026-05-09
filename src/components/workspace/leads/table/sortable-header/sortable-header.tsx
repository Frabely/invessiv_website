import Link from "next/link";
import { buildLeadHref } from "../lead-table-utils";
import styles from "./sortable-header.module.css";

type SortableHeaderProps = {
  activeSort: string | undefined;
  ascLabel: string;
  basePath: string;
  descLabel: string;
  label: string;
  queryString: string;
  sortAsc: string;
  sortDesc: string;
};

function getSortHref(
  basePath: string,
  queryString: string,
  sort: string,
): string {
  return buildLeadHref(basePath, queryString, { sort });
}

export function SortableHeader({
  activeSort,
  ascLabel,
  basePath,
  descLabel,
  label,
  queryString,
  sortAsc,
  sortDesc,
}: SortableHeaderProps) {
  const targetSort = activeSort === sortAsc ? sortDesc : sortAsc;
  const href = getSortHref(basePath, queryString, targetSort);
  const isActive = activeSort === sortAsc || activeSort === sortDesc;
  const direction =
    activeSort === sortDesc ? "↓" : activeSort === sortAsc ? "↑" : "↕";
  const nextSortLabel = targetSort === sortAsc ? ascLabel : descLabel;

  return (
    <th className={styles.sortableHeader} scope="col">
      <Link
        aria-label={`${label}: ${nextSortLabel}`}
        className={styles.sortLink}
        href={href}
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          className={styles.sortDirection}
          data-active={isActive ? "true" : "false"}
        >
          {direction}
        </span>
      </Link>
    </th>
  );
}
