import Link from "next/link";

import {
  SETTINGS_TAB_VALUES,
  SettingsTab,
} from "@/common/constants/access/settings-tabs";
import { buildSettingsTabHref } from "@/common/patterns/access/settings-tab";
import type { SettingsShellDictionary } from "@/i18n/dictionaries/workspace/settings";
import styles from "./settings-header.module.css";

type SettingsHeaderProps = {
  activeTab: SettingsTab;
  basePath: string;
  canManageRoles: boolean;
  content: SettingsShellDictionary;
};

export function SettingsHeader({
  activeTab,
  basePath,
  canManageRoles,
  content,
}: SettingsHeaderProps) {
  const tabs = canManageRoles ? SETTINGS_TAB_VALUES : [SettingsTab.Members];
  const hasTabs = tabs.length > 1;

  return (
    <header
      className={styles.header}
      data-has-tabs={hasTabs ? "true" : "false"}
    >
      <div className={styles.intro}>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.description}>{content.description}</p>
      </div>
      {hasTabs ? (
        <nav aria-label={content.tabsAriaLabel}>
          <ul className={styles.tabList}>
            {tabs.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <li key={tab}>
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={styles.tab}
                    data-active={isActive ? "true" : "false"}
                    href={buildSettingsTabHref(basePath, tab)}
                    scroll={false}
                  >
                    {content.tabs[tab]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
