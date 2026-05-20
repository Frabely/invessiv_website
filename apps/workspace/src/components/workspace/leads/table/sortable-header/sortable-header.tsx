"use client";

import { useRouter } from "next/navigation";
import { useLeadsTableTransition } from "@/hooks/workspace/use-leads-table-transition";
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
  const router = useRouter();
  const { isPending, startTransition } = useLeadsTableTransition();
  const isLoading = isPending;
  const targetSort = activeSort === sortAsc ? sortDesc : sortAsc;
  const href = getSortHref(basePath, queryString, targetSort);
  const isActive = activeSort === sortAsc || activeSort === sortDesc;
  const direction =
    activeSort === sortDesc ? "↓" : activeSort === sortAsc ? "↑" : "↕";
  const nextSortLabel = targetSort === sortAsc ? ascLabel : descLabel;

  const directionIndicator = (
    <span
      aria-hidden="true"
      className={styles.sortDirection}
      data-active={isActive ? "true" : "false"}
    >
      {direction}
    </span>
  );

  return (
    <th className={styles.sortableHeader} scope="col">
      {isLoading ? (
        <span
          aria-label={`${label}: ${nextSortLabel}`}
          className={`${styles.sortLink} ${styles.sortLinkDisabled}`}
        >
          <span>{label}</span>
          {directionIndicator}
        </span>
      ) : (
        <button
          aria-label={`${label}: ${nextSortLabel}`}
          className={styles.sortLink}
          onClick={() => startTransition(() => router.push(href))}
          type="button"
        >
          <span>{label}</span>
          {directionIndicator}
        </button>
      )}
    </th>
  );
}
