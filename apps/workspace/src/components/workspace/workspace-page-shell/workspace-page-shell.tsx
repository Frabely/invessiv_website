import type { ReactNode } from "react";
import styles from "./workspace-page-shell.module.css";

type WorkspacePageShellProps = {
  children: ReactNode;
  className?: string;
  pageId: string;
};

export function WorkspacePageShell({
  children,
  className,
  pageId,
}: WorkspacePageShellProps) {
  return (
    <div
      className={className ? `${styles.shell} ${className}` : styles.shell}
      data-workspace-page={pageId}
    >
      {children}
    </div>
  );
}
