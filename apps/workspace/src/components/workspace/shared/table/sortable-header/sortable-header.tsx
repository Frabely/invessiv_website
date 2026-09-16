"use client";

import { useRouter } from "next/navigation";
import { useTableTransition } from "@/hooks/workspace/use-table-transition";
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
  const params = new URLSearchParams(queryString);
  params.set("sort", sort);
  const nextQuery = params.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
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
  const { isPending, startTransition } = useTableTransition();
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
    <>
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
    </>
  );
}
