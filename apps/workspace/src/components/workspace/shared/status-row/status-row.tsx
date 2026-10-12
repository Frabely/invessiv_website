"use client";

import type { ReactNode } from "react";

import {
  StatusRowTone,
  type StatusRowTone as StatusRowToneValue,
} from "@/common/constants/ui/status-row-tones";
import styles from "./status-row.module.css";

export type StatusRowProps = {
  /** Status control or symbol; stays clickable on its own above the row's open target. */
  status: ReactNode;
  /** Row content; its column layout belongs to the consumer via `detailsClassName`. */
  children: ReactNode;
  detailsClassName?: string;
  /** Present only when the row opens something; the whole row then becomes the target. */
  onOpenAction?: () => void;
  /** Accessible name of the open target, e.g. "Edit task …". Required together with `onOpenAction`. */
  openLabel?: string;
  pending?: boolean;
  tone?: StatusRowToneValue;
  /** Pins the status slot to the top for rows whose content can run over several lines. */
  alignStart?: boolean;
  /** Marks the row a link or a dialog currently points at, for assistive technology as well. */
  selected?: boolean;
  /** Controls of their own at the end of the row; like the status slot they sit above the open target. */
  trailing?: ReactNode;
};

/**
 * A list row with a status slot and one open target. The open target covers the whole row, the
 * status slot sits above it, so both stay separately reachable by keyboard and pointer.
 */
export function StatusRow({
  status,
  children,
  detailsClassName,
  onOpenAction,
  openLabel,
  pending = false,
  tone = StatusRowTone.Default,
  alignStart = false,
  selected = false,
  trailing,
}: StatusRowProps) {
  const detailsClass = detailsClassName
    ? `${styles.details} ${detailsClassName}`
    : styles.details;
  return (
    <li
      aria-current={selected ? "true" : undefined}
      className={styles.row}
      data-align={alignStart ? "start" : undefined}
      data-pending={pending ? "true" : "false"}
      data-selected={selected ? "true" : undefined}
      data-tone={tone}
      data-trailing={trailing ? "true" : undefined}
    >
      <div className={styles.status}>{status}</div>
      {onOpenAction ? (
        <button
          aria-label={openLabel}
          className={detailsClass}
          onClick={onOpenAction}
          type="button"
        >
          {children}
        </button>
      ) : (
        <div className={detailsClass}>{children}</div>
      )}
      {trailing ? <div className={styles.trailing}>{trailing}</div> : null}
    </li>
  );
}
