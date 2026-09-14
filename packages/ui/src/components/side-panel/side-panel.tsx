import type { ReactNode } from "react";
import styles from "./side-panel.module.css";

export type SidePanelProps = {
  children: ReactNode;
  className?: string;
};

export function SidePanel({ children, className }: SidePanelProps) {
  return (
    <aside
      className={className ? `${styles.panel} ${className}` : styles.panel}
    >
      {children}
    </aside>
  );
}
