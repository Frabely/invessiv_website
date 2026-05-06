import type { ReactNode } from "react";
import styles from "./leads-page-shell.module.css";

type LeadsPageShellProps = {
  children: ReactNode;
};

export function LeadsPageShell({ children }: LeadsPageShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.contentSlot}>{children}</div>
    </div>
  );
}
