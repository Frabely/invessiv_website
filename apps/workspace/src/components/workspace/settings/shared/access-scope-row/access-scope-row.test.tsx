// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import {
  getSettingsAccessDictionary,
  getSettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { AccessScopeRow } from "./access-scope-row";

const accessContent = getSettingsAccessDictionary("en");
const permissionsContent = getSettingsPermissionsDictionary("en");
const role = {
  id: "role-customer",
  name: "Customer care",
  systemKey: null,
  active: true,
  description: null,
  scopeAssignable: true,
  permissions: [Permission.CustomersRead],
};

afterEach(() => cleanup());

describe("AccessScopeRow", () => {
  it("reports a direct checkbox change", () => {
    const onToggle = vi.fn();
    render(
      <AccessScopeRow
        accessContent={accessContent}
        onRemoveDirectAction={vi.fn()}
        onToggleAction={onToggle}
        permissionsContent={permissionsContent}
        roles={[
          {
            role,
            checked: false,
            direct: false,
            disabled: false,
            inherited: false,
            pending: false,
            removeDirectDisabled: false,
          },
        ]}
        scopeLabel="K0007 · Northwind"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Customer care/ }));
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(role.id, true);
    expect(
      screen.getByRole("checkbox", {
        name: "Customer care for K0007 · Northwind",
      }),
    ).toBeVisible();
  });

  it("keeps an inherited checkbox checked and locked", () => {
    render(
      <AccessScopeRow
        accessContent={accessContent}
        onRemoveDirectAction={vi.fn()}
        onToggleAction={vi.fn()}
        permissionsContent={permissionsContent}
        roles={[
          {
            role,
            checked: true,
            direct: false,
            disabled: true,
            inherited: true,
            pending: false,
            removeDirectDisabled: false,
          },
        ]}
        scopeLabel="Website relaunch"
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: /Customer care/ }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /Customer care/ }),
    ).toBeDisabled();
    expect(screen.getByText(accessContent.inherited)).toBeVisible();
  });

  it("removes a direct assignment separately when the role is also inherited", () => {
    const onRemoveDirect = vi.fn();
    render(
      <AccessScopeRow
        accessContent={accessContent}
        onRemoveDirectAction={onRemoveDirect}
        onToggleAction={vi.fn()}
        permissionsContent={permissionsContent}
        roles={[
          {
            role,
            checked: true,
            direct: true,
            disabled: true,
            inherited: true,
            pending: false,
            removeDirectDisabled: false,
          },
        ]}
        scopeLabel="Website relaunch"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove direct assignment of Customer care for Website relaunch",
      }),
    );
    expect(onRemoveDirect).toHaveBeenCalledExactlyOnceWith(role.id);
    expect(screen.getByText(accessContent.directAndInherited)).toBeVisible();
  });
});
