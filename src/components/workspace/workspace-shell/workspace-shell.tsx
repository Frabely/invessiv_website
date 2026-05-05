"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/config/i18n";
import { WorkspaceHeader } from "@/components/workspace/workspace-header/workspace-header";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar/workspace-sidebar";
import { useWorkspaceSidebarDrawer } from "@/hooks/workspace/use-workspace-sidebar-drawer";
import type { WorkspacePageContent } from "@/i18n/dictionaries/workspace";
import styles from "./workspace-shell.module.css";

type WorkspaceShellProps = {
  children?: ReactNode;
  content: WorkspacePageContent;
  locale: Locale;
};

export function WorkspaceShell({
  children,
  content,
  locale,
}: WorkspaceShellProps) {
  const { close, isOpen, toggle } = useWorkspaceSidebarDrawer();

  return (
    <div className={styles.shell}>
      <div aria-hidden="true" className={styles.background}>
        <div className={styles.blobOrange} />
        <div className={styles.blobBlue} />
        <div className={styles.grid} />
      </div>
      <WorkspaceHeader
        content={content}
        isMobileMenuOpen={isOpen}
        locale={locale}
        onMobileMenuToggleAction={toggle}
      />
      <WorkspaceSidebar
        content={content}
        isOpen={isOpen}
        locale={locale}
        onCloseAction={close}
      />
      <main
        aria-label={content.shell.main.ariaLabel}
        className={styles.main}
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}
