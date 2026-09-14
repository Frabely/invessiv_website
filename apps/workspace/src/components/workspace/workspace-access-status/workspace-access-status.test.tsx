// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getWorkspacePageContent } from "@/i18n/dictionaries/workspace";
import { WorkspaceAccessStatus } from "./workspace-access-status";

describe("WorkspaceAccessStatus", () => {
  afterEach(cleanup);

  it("reassures a new account that no further action is required", () => {
    const content = getWorkspacePageContent("de").access.pendingApproval;

    render(
      <WorkspaceAccessStatus
        content={content}
        retryHref="/de"
        variant="pending"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: content.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Du musst nichts weiter tun/)).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: content.progressLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.retryLabel }),
    ).toHaveAttribute("href", "/de");
  });

  it("explains an existing account without area permissions", () => {
    const content = getWorkspacePageContent("en").access.noPermission;

    render(
      <WorkspaceAccessStatus
        content={content}
        retryHref="/en"
        variant="restricted"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: content.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.status)).toBeInTheDocument();
    expect(
      screen.getByText(content.accessStep.description),
    ).toBeInTheDocument();
  });
});
