import type { ReactNode } from "react";
import styles from "./dashboard-page-shell.module.css";

type DashboardPageShellProps = {
  children: ReactNode;
};

export function DashboardPageShell({ children }: DashboardPageShellProps) {
  return (
    <div className={styles.shell} data-workspace-page="dashboard">
      {children}
    </div>
  );
}
