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
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import {
  customerDetailFixture,
  taskFixture,
} from "@/server/tests/workspace/crm/support/crm-fixtures";
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
        locale="en"
        customer={customer}
        projects={[]}
      />,
    );

    expect(screen.getAllByText(content.projects.empty)).toHaveLength(1);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Access" })).toBeNull();
  });

  it("names the customer once when the surrounding dialog already does", () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("en");
    const { rerender } = render(
      <CustomerCockpitView content={content} customer={customer} locale="en" />,
    );
    expect(
      screen.getByRole("heading", { name: customer.displayName }),
    ).toBeVisible();

    rerender(
      <CustomerCockpitView
        content={content}
        customer={customer}
        locale="en"
        showHeading={false}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: customer.displayName }),
    ).toBeNull();
    const statusBadge = screen
      .getByText(content.status[customer.status])
      .closest('[data-kind="status"]');
    expect(statusBadge).toHaveAttribute("data-tone", "success");
    expect(statusBadge?.querySelector("svg")).toHaveAttribute(
      "data-icon",
      "circle-check",
    );
  });

  it("shows real key figures only with data and roadmap figures without numbers", () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("en");
    const { rerender } = render(
      <CustomerCockpitView content={content} customer={customer} locale="en" />,
    );
    const figures = () =>
      screen.getByRole("list", { name: content.kpis.label });

    expect(figures()).not.toHaveTextContent(content.kpis.openTasks);
    expect(figures()).toHaveTextContent(content.kpis.hoursLeft);
    expect(figures()).toHaveTextContent(content.kpis.openFeedback);
    expect(figures()).not.toHaveTextContent(/\d/);

    rerender(
      <CustomerCockpitView
        content={content}
        customer={customer}
        locale="en"
        tasks={{
          tasks: [
            taskFixture({ status: TaskStatus.Open, dueOn: "2026-09-01" }),
            taskFixture({ status: TaskStatus.InProgress, dueOn: null }),
            taskFixture({ status: TaskStatus.Done, dueOn: "2026-09-01" }),
          ],
          readableProjectIds: [],
          writableProjectIds: [],
          members: [],
          today: "2026-09-25",
        }}
      />,
    );
    expect(figures()).toHaveTextContent(content.kpis.openTasks);
    expect(figures()).toHaveTextContent(
      content.kpis.overdueTasks.replace("{count}", "1"),
    );
  });

  it("offers the customer areas and the chat only as marked placeholders", () => {
    const content = getCrmCockpitDictionary("de");
    render(
      <CustomerCockpitView
        content={content}
        customer={customerDetailFixture()}
        locale="de"
      />,
    );

    for (const section of Object.values(content.futureSections)) {
      expect(
        screen.getByRole("heading", { name: section.title }),
      ).toBeVisible();
    }
    expect(
      screen.getByRole("button", { name: content.chat.expand }),
    ).toHaveAttribute("aria-expanded", "false");
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
      locale: "de" as const,
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
