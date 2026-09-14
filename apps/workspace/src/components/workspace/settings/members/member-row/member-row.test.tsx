// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import {
  getSettingsMembersDictionary,
  getSettingsPermissionsDictionary,
} from "@/i18n/dictionaries/workspace/settings";
import { MemberRow } from "./member-row";

const content = getSettingsMembersDictionary("de");
const permissionsContent = getSettingsPermissionsDictionary("de");

const OWNER: WorkspaceMemberDto = {
  id: "member-1",
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: true,
  hasActiveRole: true,
  roles: [],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

function renderRow(isCurrentActor: boolean) {
  const onToggleOwnerAction = vi.fn();
  render(
    <ul>
      <MemberRow
        content={content}
        isCurrentActor={isCurrentActor}
        member={OWNER}
        onEditRolesAction={vi.fn()}
        onToggleOwnerAction={onToggleOwnerAction}
        permissionsContent={permissionsContent}
      />
    </ul>,
  );
  return { onToggleOwnerAction };
}

const revokeButtonName = `${content.list.actions.revokeOwner}: ${OWNER.displayName}`;

describe("MemberRow", () => {
  afterEach(() => cleanup());

  it("offers no owner action on the actor's own row", () => {
    renderRow(true);

    expect(
      screen.queryByRole("button", { name: revokeButtonName }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: `${content.list.actions.editRoles}: ${OWNER.displayName}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.list.currentUserBadge)).toBeInTheDocument();
  });

  it("flags a member without any active role and stays quiet otherwise", () => {
    const { rerender } = render(
      <ul>
        <MemberRow
          content={content}
          isCurrentActor={false}
          member={{ ...OWNER, isOwner: false, hasActiveRole: false }}
          onEditRolesAction={vi.fn()}
          onToggleOwnerAction={vi.fn()}
          permissionsContent={permissionsContent}
        />
      </ul>,
    );
    expect(screen.getByText(content.list.noActiveRole)).toBeInTheDocument();

    rerender(
      <ul>
        <MemberRow
          content={content}
          isCurrentActor={false}
          member={OWNER}
          onEditRolesAction={vi.fn()}
          onToggleOwnerAction={vi.fn()}
          permissionsContent={permissionsContent}
        />
      </ul>,
    );
    expect(
      screen.queryByText(content.list.noActiveRole),
    ).not.toBeInTheDocument();
  });

  it("lets the actor revoke the owner role of another owner", () => {
    const { onToggleOwnerAction } = renderRow(false);

    fireEvent.click(screen.getByRole("button", { name: revokeButtonName }));

    expect(onToggleOwnerAction).toHaveBeenCalledTimes(1);
  });
});
