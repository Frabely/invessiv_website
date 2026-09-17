// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import {
  customerDetailFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";
import CrmPage from "./page";

const mocks = vi.hoisted(() => ({
  requireWorkspaceArea: vi.fn(),
  listCustomers: vi.fn(),
  getCustomerById: vi.fn(),
  getCustomerCockpitById: vi.fn(),
  listCategories: vi.fn(),
  listProjectsByCustomer: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("notFound called");
  }),
}));
vi.mock("@/lib/auth/permissions", () => ({
  requireWorkspaceArea: mocks.requireWorkspaceArea,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-customers.query-handler",
  () => ({ listCustomers: mocks.listCustomers }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/get-customer-by-id.query-handler",
  () => ({ getCustomerById: mocks.getCustomerById }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/get-customer-cockpit-by-id.query-handler",
  () => ({ getCustomerCockpitById: mocks.getCustomerCockpitById }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/list-active-customer-categories.query-handler",
  () => ({ listActiveCustomerCategories: mocks.listCategories }),
);
vi.mock(
  "@/server/workspace/crm/query-handler/list-projects-by-customer.query-handler",
  () => ({ listProjectsByCustomer: mocks.listProjectsByCustomer }),
);
vi.mock(
  "@/components/workspace/crm/detail/customer-cockpit-dialog/customer-cockpit-dialog",
  () => ({ CustomerCockpitDialog: () => <div data-testid="cockpit" /> }),
);
vi.mock(
  "@/components/workspace/crm/shell/customers-page-header/customers-page-header",
  () => ({
    CustomersPageHeader: ({ createHref }: { createHref: string | null }) => (
      <div data-create-href={createHref ?? ""} data-testid="header" />
    ),
  }),
);
vi.mock(
  "@/components/workspace/crm/list/customers-basic-list/customers-basic-list",
  () => ({
    CustomersBasicList: ({ canWrite }: { canWrite: boolean }) => (
      <div data-can-write={String(canWrite)} data-testid="list" />
    ),
  }),
);
vi.mock(
  "@/components/workspace/crm/form/customer-form-dialog/customer-form-dialog",
  () => ({
    CustomerFormDialog: ({ customer }: { customer: { id: string } | null }) => (
      <div data-customer={customer?.id ?? "new"} data-testid="dialog" />
    ),
  }),
);
vi.mock(
  "@/components/workspace/shared/table/list-pagination/list-pagination",
  () => ({ ListPagination: () => <div data-testid="pagination" /> }),
);

async function renderPage(searchParams: Record<string, string> = {}) {
  render(
    await CrmPage({
      params: Promise.resolve({ locale: "de" }),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

describe("CrmPage", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.requireWorkspaceArea.mockResolvedValue(workspaceActorWith());
    mocks.listCustomers.mockResolvedValue({
      hasCustomers: false,
      page: 1,
      perPage: 25,
      rows: [],
      total: 0,
    });
    mocks.listCategories.mockResolvedValue([]);
    mocks.listProjectsByCustomer.mockResolvedValue([]);
    mocks.getCustomerById.mockResolvedValue(null);
    mocks.getCustomerCockpitById.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it("gates the page before loading any data", async () => {
    mocks.requireWorkspaceArea.mockRejectedValue(new Error("NOT_FOUND"));

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.requireWorkspaceArea).toHaveBeenCalledWith("de", "crm");
    expect(mocks.listCustomers).not.toHaveBeenCalled();
  });

  it("offers create and edit actions with customers.write", async () => {
    await renderPage();

    expect(screen.getByTestId("header")).toHaveAttribute(
      "data-create-href",
      "/de/crm?mode=create",
    );
    expect(screen.getByTestId("list")).toHaveAttribute(
      "data-can-write",
      "true",
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("renders no write actions and ignores dialog params without customers.write", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue(
      workspaceActorWith([Permission.CustomersRead]),
    );

    await renderPage({ mode: "create" });

    expect(screen.getByTestId("header")).toHaveAttribute(
      "data-create-href",
      "",
    );
    expect(screen.getByTestId("list")).toHaveAttribute(
      "data-can-write",
      "false",
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("opens the read-only cockpit without customers.write", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue(
      workspaceActorWith([Permission.CustomersRead]),
    );
    mocks.getCustomerCockpitById.mockResolvedValue({ id: TEST_CUSTOMER_ID });

    await renderPage({ cockpit: TEST_CUSTOMER_ID });

    expect(screen.getByTestId("cockpit")).toBeInTheDocument();
    expect(mocks.getCustomerCockpitById).toHaveBeenCalledWith(TEST_CUSTOMER_ID);
  });

  it("opens the create dialog", async () => {
    await renderPage({ mode: "create" });

    expect(screen.getByTestId("dialog")).toHaveAttribute(
      "data-customer",
      "new",
    );
    expect(mocks.listCategories).toHaveBeenCalled();
  });

  it("prefills the edit dialog and opens nothing for an unknown id", async () => {
    mocks.getCustomerById.mockResolvedValueOnce(customerDetailFixture());
    await renderPage({ mode: "edit", edit: TEST_CUSTOMER_ID });
    expect(screen.getByTestId("dialog")).toHaveAttribute(
      "data-customer",
      TEST_CUSTOMER_ID,
    );
    cleanup();

    await renderPage({ mode: "edit", edit: "unknown" });
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    expect(mocks.listCategories).toHaveBeenCalledTimes(1);
  });
});
