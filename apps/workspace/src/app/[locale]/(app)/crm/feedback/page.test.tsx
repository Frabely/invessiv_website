// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { FeedbackInboxFilters } from "@/common/contracts/crm/feedback-inbox-filters";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import FeedbackInboxPage, { generateMetadata } from "./page";

const mocks = vi.hoisted(() => ({
  requireWorkspaceActor: vi.fn(),
  listFeedbackInbox: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound called");
  },
}));
vi.mock("@/lib/auth/permissions", () => ({
  requireWorkspaceActor: mocks.requireWorkspaceActor,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-feedback-inbox.query-handler",
  () => ({ listFeedbackInbox: mocks.listFeedbackInbox }),
);
vi.mock(
  "@/components/workspace/workspace-page-shell/workspace-page-shell",
  () => ({
    WorkspacePageShell: ({ children }: { children: React.ReactNode }) => (
      <main>{children}</main>
    ),
  }),
);
vi.mock(
  "@/components/workspace/crm/feedback-rounds/feedback-inbox/feedback-inbox",
  () => ({
    FeedbackInbox: ({
      basePath,
      crmPath,
      filters,
      hasActiveFilters,
    }: {
      basePath: string;
      crmPath: string;
      filters: FeedbackInboxFilters;
      hasActiveFilters: boolean;
    }) => (
      <div
        data-base={basePath}
        data-crm={crmPath}
        data-filtered={String(hasActiveFilters)}
        data-status={filters.status ?? ""}
        data-testid="inbox"
      />
    ),
  }),
);

function renderPage(searchParams: Record<string, string> = {}) {
  return FeedbackInboxPage({
    params: Promise.resolve({ locale: "de" }),
    searchParams: Promise.resolve(searchParams),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.listFeedbackInbox.mockResolvedValue({ items: [], customers: [] });
});

afterEach(cleanup);

describe("FeedbackInboxPage", () => {
  it("passes the URL filters to the query and the inbox", async () => {
    const actor = workspaceActorWith([Permission.ProjectsRead]);
    mocks.requireWorkspaceActor.mockResolvedValue(actor);

    render(await renderPage({ status: "in_progress", unread: "1" }));

    expect(mocks.listFeedbackInbox).toHaveBeenCalledWith(
      {
        status: FeedbackRoundStatus.InProgress,
        unreadOnly: true,
        customerId: null,
      },
      actor,
    );
    const inbox = screen.getByTestId("inbox");
    expect(inbox).toHaveAttribute("data-base", "/de/crm/feedback");
    expect(inbox).toHaveAttribute("data-crm", "/de/crm");
    expect(inbox).toHaveAttribute("data-filtered", "true");
  });

  it("opens for a member bound to a single project", async () => {
    const actor: WorkspaceActor = {
      ...workspaceActorWith([]),
      projectPermissions: new Map([
        [
          "project-1",
          {
            customerId: "customer-1",
            permissions: new Set([Permission.ProjectsRead]),
          },
        ],
      ]),
    };
    mocks.requireWorkspaceActor.mockResolvedValue(actor);

    render(await renderPage());

    expect(screen.getByTestId("inbox")).toHaveAttribute(
      "data-filtered",
      "false",
    );
  });

  it("answers 404 without projects.read anywhere", async () => {
    mocks.requireWorkspaceActor.mockResolvedValue(
      workspaceActorWith([Permission.ChatRead]),
    );

    await expect(renderPage()).rejects.toThrow("notFound called");
    expect(mocks.listFeedbackInbox).not.toHaveBeenCalled();
  });

  it("keeps the page out of search engines", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      nocache: true,
    });
    expect(metadata.title).toBe("Feedback | Invessiv");
  });
});
