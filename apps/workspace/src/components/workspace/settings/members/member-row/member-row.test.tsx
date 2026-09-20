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
  accessScopeCount: 0,
  roles: [],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

function renderRow(isCurrentActor: boolean) {
  const onManageRolesAction = vi.fn();
  const onOpenAccessIssueAction = vi.fn();
  const onToggleOwnerAction = vi.fn();
  const onToggleStatusAction = vi.fn();
  render(
    <ul>
      <MemberRow
        canManageAccess
        content={content}
        isCurrentActor={isCurrentActor}
        member={OWNER}
        onManageRolesAction={onManageRolesAction}
        onOpenAccessIssueAction={onOpenAccessIssueAction}
        onToggleOwnerAction={onToggleOwnerAction}
        onToggleStatusAction={onToggleStatusAction}
        permissionsContent={permissionsContent}
      />
    </ul>,
  );
  return {
    onManageRolesAction,
    onOpenAccessIssueAction,
    onToggleOwnerAction,
    onToggleStatusAction,
  };
}

const revokeButtonName = `${content.list.actions.revokeOwner}: ${OWNER.displayName}`;
const manageRolesButtonName = `${content.list.actions.manageRoles}: ${OWNER.displayName}`;

describe("MemberRow", () => {
  afterEach(() => cleanup());

  it("offers no owner action on the actor's own row", () => {
    renderRow(true);

    expect(
      screen.queryByRole("button", { name: revokeButtonName }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: manageRolesButtonName }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.list.currentUserBadge)).toBeInTheDocument();
  });

  it("opens role management from its single action button", () => {
    const { onManageRolesAction } = renderRow(false);

    fireEvent.click(
      screen.getByRole("button", { name: manageRolesButtonName }),
    );

    expect(onManageRolesAction).toHaveBeenCalledTimes(1);
  });

  it("flags a member without any active role and stays quiet otherwise", () => {
    const { rerender } = render(
      <ul>
        <MemberRow
          canManageAccess
          content={content}
          isCurrentActor={false}
          member={{ ...OWNER, isOwner: false, hasActiveRole: false }}
          onManageRolesAction={vi.fn()}
          onOpenAccessIssueAction={vi.fn()}
          onToggleOwnerAction={vi.fn()}
          onToggleStatusAction={vi.fn()}
          permissionsContent={permissionsContent}
        />
      </ul>,
    );
    expect(screen.getByText(content.list.noActiveRole)).toBeInTheDocument();

    rerender(
      <ul>
        <MemberRow
          canManageAccess
          content={content}
          isCurrentActor={false}
          member={OWNER}
          onManageRolesAction={vi.fn()}
          onOpenAccessIssueAction={vi.fn()}
          onToggleOwnerAction={vi.fn()}
          onToggleStatusAction={vi.fn()}
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

  it("offers no grant owner action for a deactivated member but keeps revoke and activate", () => {
    const inactive = { ...OWNER, active: false };
    const { rerender } = render(
      <ul>
        <MemberRow
          canManageAccess
          content={content}
          isCurrentActor={false}
          member={{ ...inactive, isOwner: false }}
          onManageRolesAction={vi.fn()}
          onOpenAccessIssueAction={vi.fn()}
          onToggleOwnerAction={vi.fn()}
          onToggleStatusAction={vi.fn()}
          permissionsContent={permissionsContent}
        />
      </ul>,
    );
    expect(
      screen.queryByRole("button", {
        name: `${content.list.actions.grantOwner}: ${OWNER.displayName}`,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: `${content.list.actions.activate}: ${OWNER.displayName}`,
      }),
    ).toBeInTheDocument();

    rerender(
      <ul>
        <MemberRow
          canManageAccess
          content={content}
          isCurrentActor={false}
          member={inactive}
          onManageRolesAction={vi.fn()}
          onOpenAccessIssueAction={vi.fn()}
          onToggleOwnerAction={vi.fn()}
          onToggleStatusAction={vi.fn()}
          permissionsContent={permissionsContent}
        />
      </ul>,
    );
    expect(
      screen.getByRole("button", { name: revokeButtonName }),
    ).toBeInTheDocument();
  });

  it("shows status and offers lifecycle actions only for another member", () => {
    const { onToggleStatusAction } = renderRow(false);
    const deactivateName = `${content.list.actions.deactivate}: ${OWNER.displayName}`;

    expect(screen.getByText(content.list.activeBadge)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: deactivateName }));
    expect(onToggleStatusAction).toHaveBeenCalledTimes(1);

    cleanup();
    renderRow(true);
    expect(
      screen.queryByRole("button", { name: deactivateName }),
    ).not.toBeInTheDocument();
  });

  it("shows the scoped access count only when access can be managed", () => {
    const { rerender } = render(
      <ul>
        <MemberRow
          canManageAccess
          content={content}
          isCurrentActor={false}
          member={{ ...OWNER, accessScopeCount: 2 }}
          onManageRolesAction={vi.fn()}
          onOpenAccessIssueAction={vi.fn()}
          onToggleOwnerAction={vi.fn()}
          onToggleStatusAction={vi.fn()}
          permissionsContent={permissionsContent}
        />
      </ul>,
    );

    expect(screen.getByText("2 gebundene Zugriffe")).toBeVisible();

    rerender(
      <ul>
        <MemberRow
          canManageAccess={false}
          content={content}
          isCurrentActor={false}
          member={{ ...OWNER, accessScopeCount: 2 }}
          onManageRolesAction={vi.fn()}
          onOpenAccessIssueAction={vi.fn()}
          onToggleOwnerAction={vi.fn()}
          onToggleStatusAction={vi.fn()}
          permissionsContent={permissionsContent}
        />
      </ul>,
    );

    expect(screen.queryByText("2 gebundene Zugriffe")).toBeNull();
  });

  it("opens the customer/project tab from the responsibility-without-access counter", () => {
    const onOpenAccessIssueAction = vi.fn();
    render(
      <ul>
        <MemberRow
          canManageAccess
          content={content}
          isCurrentActor={false}
          member={OWNER}
          onManageRolesAction={vi.fn()}
          onOpenAccessIssueAction={onOpenAccessIssueAction}
          onToggleOwnerAction={vi.fn()}
          onToggleStatusAction={vi.fn()}
          permissionsContent={permissionsContent}
          responsibilityWithoutAccessCount={2}
        />
      </ul>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Für 2 Datensätze zuständig, aber ohne Zugriff",
      }),
    );

    expect(onOpenAccessIssueAction).toHaveBeenCalledTimes(1);
  });
});
