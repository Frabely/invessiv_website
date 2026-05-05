import type { ReactNode } from "react";
import styles from "./leads-page-shell.module.css";

type LeadsPageShellProps = {
  content?: ReactNode;
  detailPanel?: ReactNode;
  header: ReactNode;
  toolbar?: ReactNode;
};

export function LeadsPageShell({
  content,
  detailPanel,
  header,
  toolbar,
}: LeadsPageShellProps) {
  return (
    <div className={styles.shell}>
      {header}
      {toolbar != null && <div className={styles.toolbarSlot}>{toolbar}</div>}
      <div className={styles.contentRow}>
        <div className={styles.contentSlot}>{content}</div>
        {detailPanel != null && (
          <aside className={styles.detailPanelSlot}>{detailPanel}</aside>
        )}
      </div>
    </div>
  );
}
