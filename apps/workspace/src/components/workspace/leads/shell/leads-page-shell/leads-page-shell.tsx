import type { ReactNode } from "react";
import {
  LeadDetailPanel,
  type LeadDetailPanelProps,
} from "@/components/workspace/leads/detail/lead-detail-panel/lead-detail-panel";
import { WorkspacePageShell } from "@/components/workspace/workspace-page-shell/workspace-page-shell";
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
    <WorkspacePageShell className={styles.shell} pageId="leads">
      <div className={styles.contentRow}>
        <div className={styles.contentSlot}>{children}</div>
        {detailPanelProps ? (
          <div className={styles.detailPanelSlot}>
            <LeadDetailPanel {...detailPanelProps} />
          </div>
        ) : null}
      </div>
    </WorkspacePageShell>
  );
}
