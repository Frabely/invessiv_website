import type { ReactNode } from "react";
import {
  LeadDetailPanel,
  type LeadDetailPanelProps,
} from "@/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel";
import styles from "./leads-page-shell.module.css";

type LeadsPageShellProps = {
  children: ReactNode;
  detailPanelProps?: LeadDetailPanelProps;
};

export function LeadsPageShell({
  children,
  detailPanelProps,
}: LeadsPageShellProps) {
  return (
    <div className={styles.shell} data-workspace-page="leads">
      <div className={styles.contentRow}>
        <div className={styles.contentSlot}>{children}</div>
        {detailPanelProps ? (
          <div className={styles.detailPanelSlot}>
            <LeadDetailPanel {...detailPanelProps} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
