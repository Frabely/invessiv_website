import type { ReactNode } from "react";

import { WorkspacePageShell } from "@/components/workspace/workspace-page-shell/workspace-page-shell";
import styles from "./workspace-scrollable-page-shell.module.css";

type WorkspaceScrollablePageShellProps = {
  children: ReactNode;
  pageId: string;
};

export function WorkspaceScrollablePageShell({
  children,
  pageId,
}: WorkspaceScrollablePageShellProps) {
  return (
    <WorkspacePageShell className={styles.shell} pageId={pageId}>
      {children}
    </WorkspacePageShell>
  );
}
