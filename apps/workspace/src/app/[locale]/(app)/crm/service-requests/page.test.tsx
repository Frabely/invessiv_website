// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ServiceRequestInboxDto } from "@invessiv/common/contracts/crm/service-requests/service-request-inbox.dto";
import type { ServiceRequestInboxFilter } from "@/common/constants/crm/service-request-inbox-query-params";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import ServiceRequestsPage, { generateMetadata } from "./page";

const mocks = vi.hoisted(() => ({
  requireWorkspaceActor: vi.fn(),
  listServiceRequestInbox: vi.fn(),
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
  "@/server/workspace/crm/query-handler/list-service-request-inbox.query-handler",
  () => ({ listServiceRequestInbox: mocks.listServiceRequestInbox }),
);
vi.mock(
  "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell",
  () => ({
    WorkspaceScrollablePageShell: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <main>{children}</main>,
  }),
);
vi.mock(
  "@/components/workspace/crm/service-requests/service-request-inbox/service-request-inbox",
  () => ({
    ServiceRequestInbox: ({
      basePath,
      crmPath,
      filter,
      inbox,
    }: {
      basePath: string;
      crmPath: string;
      filter: ServiceRequestInboxFilter;
      inbox: ServiceRequestInboxDto;
    }) => (
      <div
        data-base={basePath}
        data-crm={crmPath}
        data-filter={filter}
        data-page={inbox.page}
        data-testid="inbox"
      />
    ),
  }),
);

const emptyInbox: ServiceRequestInboxDto = {
  hasRequests: false,
  items: [],
  page: 1,
  perPage: 25,
  total: 0,
};

function renderPage(searchParams: Record<string, string> = {}) {
  return ServiceRequestsPage({
    params: Promise.resolve({ locale: "de" }),
    searchParams: Promise.resolve(searchParams),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.listServiceRequestInbox.mockResolvedValue(emptyInbox);
});

afterEach(cleanup);

describe("ServiceRequestsPage", () => {
  it("shows open requests on the first page by default", async () => {
    const actor = workspaceActorWith([Permission.ServiceRequestsRead]);
    mocks.requireWorkspaceActor.mockResolvedValue(actor);

    render(await renderPage());

    expect(mocks.listServiceRequestInbox).toHaveBeenCalledWith(true, actor, 1);
    const inbox = screen.getByTestId("inbox");
    expect(inbox).toHaveAttribute("data-base", "/de/crm/service-requests");
    expect(inbox).toHaveAttribute("data-crm", "/de/crm");
    expect(inbox).toHaveAttribute("data-filter", "open");
  });

  it("passes filter and page from the URL to the query", async () => {
    const actor = workspaceActorWith([Permission.ServiceRequestsRead]);
    mocks.requireWorkspaceActor.mockResolvedValue(actor);
    mocks.listServiceRequestInbox.mockResolvedValue({ ...emptyInbox, page: 3 });

    render(await renderPage({ filter: "all", page: "3" }));

    expect(mocks.listServiceRequestInbox).toHaveBeenCalledWith(false, actor, 3);
    const inbox = screen.getByTestId("inbox");
    expect(inbox).toHaveAttribute("data-filter", "all");
    expect(inbox).toHaveAttribute("data-page", "3");
  });

  it("answers 404 without service_requests.read anywhere", async () => {
    mocks.requireWorkspaceActor.mockResolvedValue(
      workspaceActorWith([Permission.CustomersRead]),
    );

    await expect(renderPage()).rejects.toThrow("notFound called");
    expect(mocks.listServiceRequestInbox).not.toHaveBeenCalled();
  });

  it("keeps the page out of search engines", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "de" }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      nocache: true,
    });
    expect(metadata.title).toBe("Leistungsanfragen | Invessiv");
  });
});
