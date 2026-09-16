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
  listCategories: vi.fn(),
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
  "@/server/workspace/crm/query-handler/list-active-customer-categories.query-handler",
  () => ({ listActiveCustomerCategories: mocks.listCategories }),
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
    CustomersBasicList: ({ basePath }: { basePath: string | null }) => (
      <div data-base-path={basePath ?? ""} data-testid="list" />
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
    mocks.listCustomers.mockResolvedValue({ rows: [] });
    mocks.listCategories.mockResolvedValue([]);
    mocks.getCustomerById.mockResolvedValue(null);
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
      "data-base-path",
      "/de/crm",
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
    expect(screen.getByTestId("list")).toHaveAttribute("data-base-path", "");
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
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
