// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import {
  getSettingsAccessDictionary,
  getSettingsMembersDictionary,
  getSettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { MembersList } from "./members-list";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const content = getSettingsMembersDictionary("de");
const accessContent = getSettingsAccessDictionary("de");
const permissionsContent = getSettingsPermissionsDictionary("de");
const member: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  roles: [],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

describe("MembersList role management dialog", () => {
  afterEach(cleanup);

  it("opens on the global tab from the row action and returns focus to the trigger on close", async () => {
    render(
      <MembersList
        accessContent={accessContent}
        accessScopesByMember={{ [member.id]: [] }}
        canManageAccess
        content={content}
        currentMemberId="member-current"
        members={[member]}
        permissionsContent={permissionsContent}
        roles={[]}
        rolesHref="/de/settings?tab=roles"
      />,
    );
    const trigger = screen.getByRole("button", {
      name: `${content.list.actions.manageRoles}: ${member.displayName}`,
    });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(
      screen.getByRole("tab", {
        name: new RegExp(content.rolesDialog.globalTab),
      }),
    ).toHaveAttribute("aria-selected", "true");

    fireEvent.click(
      screen.getByRole("button", { name: content.rolesDialog.cancel }),
    );

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("opens directly on the customer/project tab from the responsibility hint", () => {
    render(
      <MembersList
        accessContent={accessContent}
        accessScopesByMember={{ [member.id]: [] }}
        canManageAccess
        content={content}
        currentMemberId="member-current"
        members={[member]}
        permissionsContent={permissionsContent}
        responsibilityWithoutAccessByMember={{ [member.id]: 1 }}
        roles={[]}
        rolesHref="/de/settings?tab=roles"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: content.list.responsibilityWithoutAccessOne,
      }),
    );

    expect(
      screen.getByRole("tab", { name: content.rolesDialog.customerTab }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("button", { name: content.rolesDialog.submit }),
    ).toBeDisabled();
  });
});
