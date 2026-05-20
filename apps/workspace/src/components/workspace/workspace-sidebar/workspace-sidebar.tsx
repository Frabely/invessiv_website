"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import type { WorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { WORKSPACE_SIDEBAR_ITEMS } from "./workspace-sidebar-items";
import styles from "./workspace-sidebar.module.css";

type WorkspaceSidebarProps = {
  content: WorkspacePageContent;
  isOpen: boolean;
  locale: Locale;
  onCloseAction: () => void;
};

export function WorkspaceSidebar({
  content,
  isOpen,
  locale,
  onCloseAction,
}: WorkspaceSidebarProps) {
  const sidebarContent = content.shell.sidebar;
  const headerContent = content.shell.header;
  const dataOpen = isOpen ? "true" : "false";
  const pathname = usePathname();

  return (
    <>
      <button
        aria-hidden="true"
        className={styles.backdrop}
        data-open={dataOpen}
        onClick={onCloseAction}
        tabIndex={-1}
        type="button"
      />
      <aside
        aria-label={isOpen ? sidebarContent.navAriaLabel : undefined}
        aria-modal={isOpen ? "true" : undefined}
        className={styles.sidebar}
        data-open={dataOpen}
        role={isOpen ? "dialog" : undefined}
      >
        <button
          aria-label={headerContent.mobileMenuCloseLabel}
          className={styles.closeButton}
          onClick={onCloseAction}
          tabIndex={isOpen ? 0 : -1}
          type="button"
        >
          <span aria-hidden="true" className={styles.closeIcon}>
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path d="M6 6 18 18" />
              <path d="M18 6 6 18" />
            </svg>
          </span>
        </button>
        <nav aria-label={sidebarContent.navAriaLabel} className={styles.nav}>
          <ul className={styles.list}>
            {WORKSPACE_SIDEBAR_ITEMS.map((item) => {
              const isDisabled = item.path === null;
              const href = `/${locale}${item.path ?? SITE_ROUTES.WORKSPACE}`;
              const isActive =
                !isDisabled &&
                (pathname === href || pathname.startsWith(`${href}/`));

              const icon = (
                <span aria-hidden="true" className={styles.linkIcon}>
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.7}
                    viewBox={item.iconViewBox}
                  >
                    {item.iconPaths.map((d) => (
                      <path d={d} key={d} />
                    ))}
                  </svg>
                </span>
              );

              return (
                <li className={styles.item} key={item.id}>
                  {isDisabled ? (
                    <a
                      aria-disabled="true"
                      className={styles.link}
                      role="link"
                      tabIndex={-1}
                    >
                      {icon}
                      <span className={styles.linkLabel}>
                        {sidebarContent.items[item.labelKey]}
                      </span>
                      <span aria-hidden="true" className={styles.linkBadge}>
                        {sidebarContent.comingSoonBadge}
                      </span>
                    </a>
                  ) : (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={styles.link}
                      data-active={isActive ? "true" : "false"}
                      href={href}
                    >
                      {icon}
                      <span className={styles.linkLabel}>
                        {sidebarContent.items[item.labelKey]}
                      </span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
