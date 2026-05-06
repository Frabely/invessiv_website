// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LeadsPage from "./page";

const mockListLeads = vi.hoisted(() => vi.fn());
const mockGetLeadCategories = vi.hoisted(() => vi.fn());
const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));
const mockLeadsPageShell = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="leads-shell">{children}</div>
  )),
);
const mockLeadsPageHeader = vi.hoisted(() =>
  vi.fn(() => <div data-testid="leads-header" />),
);
const mockLeadsTable = vi.hoisted(() =>
  vi.fn(({ emptyState }: { emptyState?: { title: string } }) => (
    <div data-testid="leads-table">
      {emptyState ? (
        <div data-testid="empty-state">{emptyState.title}</div>
      ) : null}
    </div>
  )),
);
const mockLeadsPagination = vi.hoisted(() =>
  vi.fn(() => <div data-testid="leads-pagination" />),
);

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  notFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));

vi.mock(
  "@/components/workspace/leads/shell/leads-page-header/leads-page-header",
  () => ({
    LeadsPageHeader: mockLeadsPageHeader,
  }),
);

vi.mock(
  "@/components/workspace/leads/shell/leads-page-shell/leads-page-shell",
  () => ({
    LeadsPageShell: mockLeadsPageShell,
  }),
);

vi.mock(
  "@/components/workspace/leads/table/leads-pagination/leads-pagination",
  () => ({
    LeadsPagination: mockLeadsPagination,
  }),
);

vi.mock("@/components/workspace/leads/table/leads-table/leads-table", () => ({
  LeadsTable: mockLeadsTable,
}));

vi.mock(
  "@/server/workspace/leads/query-handler/list-leads.query-handler",
  () => ({
    listLeads: mockListLeads,
  }),
);

vi.mock(
  "@/server/workspace/leads/query-handler/list-lead-categories.query-handler",
  () => ({
    getLeadCategories: mockGetLeadCategories,
  }),
);

describe("LeadsPage", () => {
  beforeEach(() => {
    mockListLeads.mockReset();
    mockGetLeadCategories.mockReset();
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockLeadsPageShell.mockClear();
    mockLeadsPageHeader.mockClear();
    mockLeadsTable.mockClear();
    mockLeadsPagination.mockClear();
  });

  it("renders pagination even when the lead list is empty", async () => {
    mockListLeads.mockResolvedValue({
      page: 1,
      perPage: 20,
      rows: [],
      total: 0,
    });
    mockGetLeadCategories.mockResolvedValue([]);

    render(
      await LeadsPage({
        params: Promise.resolve({ locale: "de" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getByTestId("leads-pagination")).toBeInTheDocument();
    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      "Noch keine Leads",
    );
    expect(mockLeadsPagination).toHaveBeenCalledWith(
      expect.objectContaining({ total: 0, currentPage: 1 }),
      undefined,
    );
  });
});
