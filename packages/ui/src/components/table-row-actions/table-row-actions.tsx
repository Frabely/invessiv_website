"use client";

import {
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  useState,
} from "react";
import styles from "./table-row-actions.module.css";

export type TableRowActionsProps = {
  children: ReactNode;
  className?: string;
  isPinned?: boolean;
  menuIcon: ReactNode;
  menuLabel: string;
};

function stopRowPropagation(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

/** A responsive action group for a table row: inline on desktop, collapsed on mobile. */
export function TableRowActions({
  children,
  className,
  isPinned,
  menuIcon,
  menuLabel,
}: TableRowActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleCellBlur(event: FocusEvent<HTMLTableCellElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsMenuOpen(false);
    }
  }

  return (
    <td
      className={className ? `${styles.cell} ${className}` : styles.cell}
      data-pinned={isPinned ? "true" : undefined}
      onBlur={handleCellBlur}
      onClick={stopRowPropagation}
      onMouseDown={stopRowPropagation}
    >
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label={menuLabel}
        className={styles.menuTrigger}
        onClick={() => setIsMenuOpen((current) => !current)}
        title={menuLabel}
        type="button"
      >
        {menuIcon}
      </button>
      <div className={styles.group} data-open={isMenuOpen ? "true" : "false"}>
        {children}
      </div>
    </td>
  );
}
