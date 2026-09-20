"use client";

import { type KeyboardEvent, useRef } from "react";

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
  const globalTabRef = useRef<HTMLButtonElement>(null);
  const customerTabRef = useRef<HTMLButtonElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const tabs = canManageAccess
      ? [MemberRolesTab.Global, MemberRolesTab.Customer]
      : [MemberRolesTab.Global];
    const currentIndex = tabs.indexOf(activeTab);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight")
      nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = tabs[nextIndex] ?? MemberRolesTab.Global;
    onSelectAction(next);
    (next === MemberRolesTab.Global
      ? globalTabRef.current
      : customerTabRef.current
    )?.focus();
  }

  return (
    <div aria-label={text.tabsLabel} className={styles.tabs} role="tablist">
      <button
        aria-controls={globalPanelId}
        aria-selected={activeTab === MemberRolesTab.Global}
        className={styles.tab}
        id={globalTabId}
        onClick={() => onSelectAction(MemberRolesTab.Global)}
        onKeyDown={handleKeyDown}
        ref={globalTabRef}
        role="tab"
        tabIndex={activeTab === MemberRolesTab.Global ? 0 : -1}
        type="button"
      >
        {text.globalTab}
        {globalIsDirty ? (
          <span className={styles.unsaved}>{text.unsaved}</span>
        ) : null}
      </button>
      {canManageAccess ? (
        <button
          aria-controls={customerPanelId}
          aria-selected={activeTab === MemberRolesTab.Customer}
          className={styles.tab}
          id={customerTabId}
          onClick={() => onSelectAction(MemberRolesTab.Customer)}
          onKeyDown={handleKeyDown}
          ref={customerTabRef}
          role="tab"
          tabIndex={activeTab === MemberRolesTab.Customer ? 0 : -1}
          type="button"
        >
          {text.customerTab}
          {customerIsDirty ? (
            <span className={styles.unsaved}>{text.unsaved}</span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
