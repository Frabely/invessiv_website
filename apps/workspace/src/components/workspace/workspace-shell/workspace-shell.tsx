"use client";

import { type ReactNode, useTransition } from "react";
import type { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import type { Locale } from "@/config/i18n";
import { WorkspaceHeader } from "@/components/workspace/workspace-header/workspace-header";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar/workspace-sidebar";
import { useWorkspaceSidebarDrawer } from "@/hooks/workspace/use-workspace-sidebar-drawer";
import { NavigationContext } from "@/hooks/workspace/use-navigation-context";
import type { WorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { NavigationProgress } from "./navigation-progress/navigation-progress";
import styles from "./workspace-shell.module.css";

type WorkspaceShellProps = {
  children?: ReactNode;
  content: WorkspacePageContent;
  locale: Locale;
  permittedAreas: readonly WorkspaceArea[];
};

export function WorkspaceShell({
  children,
  content,
  locale,
  permittedAreas,
}: WorkspaceShellProps) {
  const { close, isOpen, toggle } = useWorkspaceSidebarDrawer();
  const [isPending, startTransition] = useTransition();
  const hasNavigation = permittedAreas.length > 0;

  return (
    <NavigationContext value={startTransition}>
      <div
        className={styles.shell}
        data-has-navigation={hasNavigation ? "true" : "false"}
      >
        <NavigationProgress isPending={isPending} />
        <div aria-hidden="true" className={styles.background}>
          <div className={styles.blobOrange} />
          <div className={styles.blobBlue} />
          <div className={styles.grid} />
        </div>
        <WorkspaceHeader
          content={content}
          hasNavigation={hasNavigation}
          isMobileMenuOpen={isOpen}
          locale={locale}
          onMobileMenuToggleAction={toggle}
        />
        {hasNavigation ? (
          <WorkspaceSidebar
            content={content}
            isOpen={isOpen}
            locale={locale}
            onCloseAction={close}
            permittedAreas={permittedAreas}
          />
        ) : null}
        <main
          aria-label={content.shell.main.ariaLabel}
          className={styles.main}
          id="main-content"
        >
          {children}
        </main>
      </div>
    </NavigationContext>
  );
}
