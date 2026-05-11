"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigationContext } from "@/hooks/workspace/use-navigation-context";
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
  const router = useRouter();
  const startTransition = useNavigationContext();

  return (
    <td
      className={styles.cell}
      onClick={stopRowPropagation}
      onMouseDown={stopRowPropagation}
    >
      <button
        aria-label={editLabel}
        className={styles.button}
        onClick={(event) => {
          stopRowPropagation(event);
          startTransition(() => router.push(editHref));
        }}
        title={editLabel}
        type="button"
      >
        <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
      </button>
    </td>
  );
}
