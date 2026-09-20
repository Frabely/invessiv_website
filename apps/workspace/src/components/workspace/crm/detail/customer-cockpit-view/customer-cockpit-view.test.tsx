// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import {
  getCrmAccessDictionary,
  getCrmCockpitDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { customerDetailFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomerCockpitView } from "./customer-cockpit-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("CustomerCockpitView", () => {
  afterEach(cleanup);

  it("renders the empty projects state without a dialog shell", () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("en");

    render(
      <CustomerCockpitView
        content={content}
        customer={customer}
        projects={[]}
      />,
    );

    expect(screen.getAllByText(content.projects.empty)).toHaveLength(2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Access" })).toBeNull();
  });

  it("shows an actionable observation until the owner has access", async () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("de");
    const member: WorkspaceMemberDto = {
      id: customer.ownerMemberId ?? "member-owner",
      userId: "user-1",
      displayName: customer.ownerDisplayName ?? "Owner",
      primaryEmail: "owner@example.test",
      active: true,
      isOwner: false,
      hasActiveRole: true,
      accessScopeCount: 0,
      roles: [],
      version: 1,
      createdAt: "2026-09-19T10:00:00.000Z",
    };
    const props = {
      accessContent: getCrmAccessDictionary("de"),
      accessMembers: [member],
      accessProjects: [],
      accessRoles: [],
      accessScopes: [],
      content,
      customer,
      customerOwnerMemberId: member.id,
      permissionsContent: getSettingsPermissionsDictionary("de"),
      projects: [],
      rolesHref: "/de/settings?tab=roles",
    };
    const { rerender } = render(
      <CustomerCockpitView {...props} customerOwnerHasAccess={false} />,
    );

    fireEvent.click(
      screen.getAllByRole("button", {
        name: content.ownerAccess.grantAccess,
      })[0],
    );
    expect(await screen.findByRole("dialog")).toBeVisible();

    rerender(<CustomerCockpitView {...props} customerOwnerHasAccess />);
    expect(screen.queryByText(content.ownerAccess.observation)).toBeNull();
  });
});
