// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import LeadsPage from "./page";

const mockListLeads = vi.hoisted(() => vi.fn());
const mockGetLeadCategories = vi.hoisted(() => vi.fn());
const mockGetLeadById = vi.hoisted(() => vi.fn());
const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));
const mockRedirect = vi.hoisted(() => vi.fn());
const mockLeadsPageShell = vi.hoisted(() =>
  vi.fn(
    ({
      children,
      detailPanelProps,
    }: {
      children: ReactNode;
      detailPanelProps?: unknown;
    }) => (
      <div data-testid="leads-shell">
        {children}
        {detailPanelProps ? <div data-testid="detail-slot" /> : null}
      </div>
    ),
  ),
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
const mockAddLeadDialog = vi.hoisted(() =>
  vi.fn(() => <div data-testid="lead-form-dialog" />),
);
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  redirect: mockRedirect,
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

vi.mock(
  "@/components/workspace/leads/form/lead-form-dialog/lead-form-dialog",
  () => ({
    LeadFormDialog: mockAddLeadDialog,
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

vi.mock(
  "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler",
  () => ({
    getLeadById: mockGetLeadById,
  }),
);

describe("LeadsPage", () => {
  beforeEach(() => {
    mockListLeads.mockReset();
    mockGetLeadCategories.mockReset();
    mockGetLeadById.mockReset();
    mockRedirect.mockReset();
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockLeadsPageShell.mockClear();
    mockLeadsPageHeader.mockClear();
    mockLeadsTable.mockClear();
    mockLeadsPagination.mockClear();
    mockAddLeadDialog.mockClear();
  });

  afterEach(() => {
    cleanup();
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
    expect(mockLeadsPageHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        addLeadHref: `/de/leads?${LeadListQueryParam.Mode}=create`,
      }),
      undefined,
    );
    expect(mockAddLeadDialog).toHaveBeenCalledWith(
      expect.objectContaining({ open: false }),
      undefined,
    );
    expect(mockLeadsPagination).toHaveBeenCalledWith(
      expect.objectContaining({ total: 0, currentPage: 1 }),
      undefined,
    );
  });

  it("loads selected lead detail for a valid selected UUID", async () => {
    const selected = "2b3d2f33-f3d7-4f8a-8ff6-6ac5df6c9b01";
    mockListLeads.mockResolvedValue({
      page: 1,
      perPage: 20,
      rows: [],
      total: 0,
    });
    mockGetLeadCategories.mockResolvedValue([]);
    mockGetLeadById.mockResolvedValue({ id: selected });

    render(
      await LeadsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({
          email: "anna@example.com",
          selected,
          status: "qualified",
        }),
      }),
    );

    expect(mockGetLeadById).toHaveBeenCalledWith(selected);
    expect(screen.getByTestId("detail-slot")).toBeInTheDocument();
    expect(mockLeadsPageShell).toHaveBeenCalledWith(
      expect.objectContaining({
        detailPanelProps: expect.objectContaining({
          closeHref: "/en/leads?status=qualified",
          lead: { id: selected },
        }),
      }),
      undefined,
    );
  });

  it("redirects stale selected lead URLs to the list without selected", async () => {
    const selected = "2b3d2f33-f3d7-4f8a-8ff6-6ac5df6c9b01";
    mockListLeads.mockResolvedValue({
      page: 1,
      perPage: 20,
      rows: [],
      total: 0,
    });
    mockGetLeadCategories.mockResolvedValue([]);
    mockGetLeadById.mockResolvedValue(null);
    mockRedirect.mockImplementation(() => {
      throw new Error("redirect called");
    });

    await expect(
      LeadsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({
          email: "anna@example.com",
          selected,
          status: "qualified",
        }),
      }),
    ).rejects.toThrow("redirect called");

    expect(mockGetLeadById).toHaveBeenCalledWith(selected);
    expect(mockRedirect).toHaveBeenCalledWith("/en/leads?status=qualified");
    expect(mockLeadsPageShell).not.toHaveBeenCalled();
  });

  it("does not query detail data without selected", async () => {
    mockListLeads.mockResolvedValue({
      page: 1,
      perPage: 20,
      rows: [],
      total: 0,
    });
    mockGetLeadCategories.mockResolvedValue([]);

    render(
      await LeadsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(mockGetLeadById).not.toHaveBeenCalled();
    expect(screen.queryByTestId("detail-slot")).not.toBeInTheDocument();
  });

  it("opens the create dialog when mode=create is present", async () => {
    mockListLeads.mockResolvedValue({
      page: 1,
      perPage: 20,
      rows: [],
      total: 0,
    });
    mockGetLeadCategories.mockResolvedValue([]);

    render(
      await LeadsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({
          mode: "create",
        }),
      }),
    );

    expect(mockAddLeadDialog).toHaveBeenCalledWith(
      expect.objectContaining({ open: true }),
      undefined,
    );
  });

  it("opens the edit dialog when mode=edit and a valid edit id are present", async () => {
    const editId = "2b3d2f33-f3d7-4f8a-8ff6-6ac5df6c9b01";
    mockListLeads.mockResolvedValue({
      page: 1,
      perPage: 20,
      rows: [],
      total: 0,
    });
    mockGetLeadCategories.mockResolvedValue([]);
    mockGetLeadById.mockResolvedValue({ id: editId });

    render(
      await LeadsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({
          edit: editId,
          mode: "edit",
        }),
      }),
    );

    expect(mockAddLeadDialog).toHaveBeenCalledWith(
      expect.objectContaining({ open: true, mode: "edit" }),
      undefined,
    );
  });

  it("does not query detail data for invalid selected", async () => {
    mockListLeads.mockResolvedValue({
      page: 1,
      perPage: 20,
      rows: [],
      total: 0,
    });
    mockGetLeadCategories.mockResolvedValue([]);

    render(
      await LeadsPage({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({ selected: "not-a-uuid" }),
      }),
    );

    expect(mockGetLeadById).not.toHaveBeenCalled();
    expect(screen.queryByTestId("detail-slot")).not.toBeInTheDocument();
  });
});
