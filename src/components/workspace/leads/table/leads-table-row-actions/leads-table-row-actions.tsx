"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./leads-table-row-actions.module.css";

type LeadsTableRowActionsProps = {
  editHref: string;
  editLabel: string;
};

function stopRowPropagation(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

export function LeadsTableRowActions({
  editHref,
  editLabel,
}: LeadsTableRowActionsProps) {
  return (
    <td
      className={styles.cell}
      onClick={stopRowPropagation}
      onMouseDown={stopRowPropagation}
    >
      <Link
        aria-label={editLabel}
        className={styles.button}
        href={editHref}
        onClick={stopRowPropagation}
        title={editLabel}
      >
        <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
      </Link>
    </td>
  );
}
