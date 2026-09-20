// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MemberRolesTab } from "@/common/constants/access/member-roles-tabs";
import { getSettingsMembersDictionary } from "@/i18n/dictionaries/workspace/settings";
import { MemberRolesTabs } from "./member-roles-tabs";

afterEach(cleanup);

describe("MemberRolesTabs", () => {
  const text = getSettingsMembersDictionary("de").rolesDialog;

  it("moves selection and focus with arrow keys", () => {
    const onSelect = vi.fn();
    render(
      <MemberRolesTabs
        activeTab={MemberRolesTab.Global}
        canManageAccess
        customerPanelId="customer-panel"
        customerTabId="customer-tab"
        globalPanelId="global-panel"
        globalTabId="global-tab"
        customerIsDirty={false}
        globalIsDirty={false}
        onSelectAction={onSelect}
        text={text}
      />,
    );

    fireEvent.keyDown(screen.getByRole("tab", { name: text.globalTab }), {
      key: "ArrowRight",
    });

    expect(onSelect).toHaveBeenCalledWith(MemberRolesTab.Customer);
    expect(screen.getByRole("tab", { name: text.customerTab })).toHaveFocus();
  });

  it("hides customer access for actors without manage permission", () => {
    render(
      <MemberRolesTabs
        activeTab={MemberRolesTab.Global}
        canManageAccess={false}
        customerPanelId="customer-panel"
        customerTabId="customer-tab"
        globalPanelId="global-panel"
        globalTabId="global-tab"
        customerIsDirty={false}
        globalIsDirty
        onSelectAction={vi.fn()}
        text={text}
      />,
    );

    expect(screen.queryByRole("tab", { name: text.customerTab })).toBeNull();
    expect(screen.getByText(text.unsaved)).toBeVisible();
  });
});
