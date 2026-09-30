// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { getWorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { WorkspaceSidebar } from "./workspace-sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/crm/feedback",
}));

const content = getWorkspacePageContent("de");

function renderSidebar(
  overrides: {
    canOpenCrmFeedback?: boolean;
    unreadFeedbackRoundCount?: number;
  } = {},
) {
  render(
    <WorkspaceSidebar
      canOpenCrmCustomers
      canOpenCrmFeedback={overrides.canOpenCrmFeedback ?? true}
      canOpenCrmMessages={false}
      canOpenCrmTasks={false}
      canReadCrmLineItemTemplates={false}
      content={content}
      isOpen={false}
      locale="de"
      onCloseAction={vi.fn()}
      permittedAreas={[WorkspaceArea.Crm]}
      unreadConversationCount={0}
      unreadFeedbackRoundCount={overrides.unreadFeedbackRoundCount ?? 0}
    />,
  );
}

afterEach(cleanup);

describe("WorkspaceSidebar feedback entry", () => {
  it("links the inbox and marks it as the current page", () => {
    renderSidebar();
    const link = screen.getByRole("link", { name: "Feedback" });
    expect(link).toHaveAttribute("href", "/de/crm/feedback");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("speaks the number of newly submitted rounds", () => {
    renderSidebar({ unreadFeedbackRoundCount: 3 });
    expect(
      screen.getByRole("link", {
        name: /^Feedback\s*3 neu eingereichte Feedbackrunden$/,
      }),
    ).toBeInTheDocument();

    cleanup();
    renderSidebar({ unreadFeedbackRoundCount: 1 });
    expect(
      screen.getByRole("link", {
        name: /^Feedback\s*1 neu eingereichte Feedbackrunde$/,
      }),
    ).toBeInTheDocument();
  });

  it("shows no badge at zero and no entry without projects.read", () => {
    renderSidebar();
    expect(
      screen.getByRole("link", { name: "Feedback" }),
    ).not.toHaveTextContent("0");
    cleanup();

    renderSidebar({ canOpenCrmFeedback: false });
    expect(
      screen.queryByRole("link", { name: /Feedback/ }),
    ).not.toBeInTheDocument();
  });
});
