"use client";

import { TabList } from "@invessiv/ui";

import { MemberRolesTab } from "@/common/constants/access/member-roles-tabs";
import type { SettingsMembersDictionary } from "@/i18n/dictionaries/workspace/settings";
import styles from "./member-roles-tabs.module.css";

type MemberRolesTabsProps = {
  activeTab: MemberRolesTab;
  canManageAccess: boolean;
  customerPanelId: string;
  customerTabId: string;
  globalPanelId: string;
  globalTabId: string;
  customerIsDirty: boolean;
  globalIsDirty: boolean;
  onSelectAction: (tab: MemberRolesTab) => void;
  text: SettingsMembersDictionary["rolesDialog"];
};

export function MemberRolesTabs({
  activeTab,
  canManageAccess,
  customerPanelId,
  customerTabId,
  globalPanelId,
  globalTabId,
  customerIsDirty,
  globalIsDirty,
  onSelectAction,
  text,
}: MemberRolesTabsProps) {
  return (
    <TabList
      activeValue={activeTab}
      ariaLabel={text.tabsLabel}
      className={styles.tabs}
      items={[
        {
          value: MemberRolesTab.Global,
          id: globalTabId,
          panelId: globalPanelId,
          label: (
            <>
              {text.globalTab}
              {globalIsDirty ? (
                <span className={styles.unsaved}>{text.unsaved}</span>
              ) : null}
            </>
          ),
        },
        ...(canManageAccess
          ? [
              {
                value: MemberRolesTab.Customer,
                id: customerTabId,
                panelId: customerPanelId,
                label: (
                  <>
                    {text.customerTab}
                    {customerIsDirty ? (
                      <span className={styles.unsaved}>{text.unsaved}</span>
                    ) : null}
                  </>
                ),
              },
            ]
          : []),
      ]}
      onSelectAction={onSelectAction}
      tabClassName={styles.tab}
    />
  );
}
