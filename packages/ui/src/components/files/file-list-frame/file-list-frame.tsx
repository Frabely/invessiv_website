"use client";

import type { ReactNode } from "react";
import { ButtonControl } from "../../button/button";
import styles from "./file-list-frame.module.css";

export type FileListFrameProps = {
  emptyState: ReactNode;
  errorLabel: string;
  hasMore: boolean;
  isError: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  listLabel: string;
  loadingLabel: string;
  loadMoreLabel: string;
  retryLabel: string;
  rows: ReactNode;
  shownLabel: string;
  count: number;
  spacious?: boolean;
  onLoadMoreAction: () => void;
  onReloadAction: () => void;
};

export function FileListFrame({
  emptyState,
  errorLabel,
  hasMore,
  isError,
  isLoading,
  isLoadingMore,
  listLabel,
  loadingLabel,
  loadMoreLabel,
  retryLabel,
  rows,
  shownLabel,
  count,
  spacious = false,
  onLoadMoreAction,
  onReloadAction,
}: FileListFrameProps) {
  if (isLoading && count === 0)
    return (
      <p
        className={styles.state}
        data-spacious={spacious ? "true" : "false"}
        role="status"
      >
        {loadingLabel}
      </p>
    );
  if (isError && count === 0)
    return (
      <div
        className={styles.state}
        data-spacious={spacious ? "true" : "false"}
        role="alert"
      >
        <p>{errorLabel}</p>
        <ButtonControl onClick={onReloadAction} type="button" variant="ghost">
          {retryLabel}
        </ButtonControl>
      </div>
    );
  if (count === 0) return <>{emptyState}</>;

  return (
    <>
      <ul
        aria-busy={isLoading}
        aria-label={listLabel}
        className={styles.list}
        data-spacious={spacious ? "true" : "false"}
      >
        {rows}
      </ul>
      <div className={styles.more} data-spacious={spacious ? "true" : "false"}>
        <p className={styles.shown}>{shownLabel}</p>
        {hasMore ? (
          <ButtonControl
            disabled={isLoadingMore}
            onClick={onLoadMoreAction}
            type="button"
            variant="ghost"
          >
            {loadMoreLabel}
          </ButtonControl>
        ) : null}
      </div>
    </>
  );
}
