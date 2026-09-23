"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faAddressBook,
  faChartColumn,
  faGear,
  faLayerGroup,
  faListCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { WorkspaceSidebarItemKey } from "@/common/constants/navigation/workspace-sidebar-item-keys";
import { WORKSPACE_SIDEBAR_ITEMS } from "@/common/constants/navigation/workspace-sidebar-items";
import type { Locale } from "@/config/i18n";
import type { WorkspacePageContent } from "@/i18n/dictionaries/workspace";
import {
  crmLineItemTemplatesPathFor,
  crmTasksPathFor,
  workspaceAreaPathFor,
} from "@/lib/auth/routes";
import styles from "./workspace-sidebar.module.css";

type WorkspaceSidebarProps = {
  canOpenCrmCustomers: boolean;
  canOpenCrmTasks: boolean;
  canReadCrmLineItemTemplates: boolean;
  content: WorkspacePageContent;
  isOpen: boolean;
  locale: Locale;
  onCloseAction: () => void;
  permittedAreas: readonly WorkspaceArea[];
};

const SIDEBAR_ICONS = {
  [WorkspaceSidebarItemKey.Overview]: faChartColumn,
  [WorkspaceSidebarItemKey.Leads]: faUsers,
  [WorkspaceSidebarItemKey.Crm]: faAddressBook,
  [WorkspaceSidebarItemKey.Settings]: faGear,
} satisfies Record<WorkspaceSidebarItemKey, IconDefinition>;

export function WorkspaceSidebar({
  canOpenCrmCustomers,
  canOpenCrmTasks,
  canReadCrmLineItemTemplates,
  content,
  isOpen,
  locale,
  onCloseAction,
  permittedAreas,
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
            {WORKSPACE_SIDEBAR_ITEMS.filter((item) =>
              permittedAreas.includes(item.area),
            ).map((item) => {
              const href = workspaceAreaPathFor(locale, item.area);
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              const isCrm = item.id === WorkspaceSidebarItemKey.Crm;
              const crmTasksHref = crmTasksPathFor(locale);
              const crmLineItemTemplatesHref =
                crmLineItemTemplatesPathFor(locale);

              const icon = (
                <span aria-hidden="true" className={styles.linkIcon}>
                  <FontAwesomeIcon icon={SIDEBAR_ICONS[item.id]} />
                </span>
              );

              return (
                <li
                  className={styles.item}
                  data-crm={isCrm ? "true" : undefined}
                  key={item.id}
                >
                  {isCrm ? (
                    <div
                      className={`${styles.link} ${styles.crmGroupLabel}`}
                      data-active={isActive ? "true" : "false"}
                    >
                      {icon}
                      <span className={styles.linkLabel}>
                        {sidebarContent.items[item.labelKey]}
                      </span>
                    </div>
                  ) : (
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={styles.link}
                      data-active={isActive ? "true" : "false"}
                      href={href}
                      onClick={onCloseAction}
                    >
                      {icon}
                      <span className={styles.linkLabel}>
                        {sidebarContent.items[item.labelKey]}
                      </span>
                    </Link>
                  )}
                  {isCrm ? (
                    <ul
                      aria-label={sidebarContent.crmSubNavigationLabel}
                      className={styles.crmChildren}
                    >
                      {canOpenCrmCustomers ? (
                        <li>
                          <Link
                            aria-current={
                              pathname === href ? "page" : undefined
                            }
                            className={styles.crmChildLink}
                            data-active={pathname === href ? "true" : "false"}
                            href={href}
                            onClick={onCloseAction}
                          >
                            <FontAwesomeIcon icon={faUsers} />
                            <span>{sidebarContent.items.customers}</span>
                          </Link>
                        </li>
                      ) : null}
                      {canOpenCrmTasks ? (
                        <li>
                          <Link
                            aria-current={
                              pathname === crmTasksHref ? "page" : undefined
                            }
                            className={styles.crmChildLink}
                            data-active={
                              pathname === crmTasksHref ? "true" : "false"
                            }
                            href={crmTasksHref}
                            onClick={onCloseAction}
                          >
                            <FontAwesomeIcon icon={faListCheck} />
                            <span>{sidebarContent.items.tasks}</span>
                          </Link>
                        </li>
                      ) : null}
                      {canReadCrmLineItemTemplates ? (
                        <li>
                          <Link
                            aria-current={
                              pathname === crmLineItemTemplatesHref
                                ? "page"
                                : undefined
                            }
                            className={styles.crmChildLink}
                            data-active={
                              pathname === crmLineItemTemplatesHref
                                ? "true"
                                : "false"
                            }
                            href={crmLineItemTemplatesHref}
                            onClick={onCloseAction}
                          >
                            <FontAwesomeIcon icon={faLayerGroup} />
                            <span>
                              {sidebarContent.items.lineItemTemplates}
                            </span>
                          </Link>
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
