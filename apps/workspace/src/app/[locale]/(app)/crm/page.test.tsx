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
  listCockpitProjectsByCustomer: vi.fn(),
  listCustomerAccessScopes: vi.fn(),
  listAccessCustomerProjects: vi.fn(),
  listWorkspaceMembers: vi.fn(),
  listRoleAssignmentOptions: vi.fn(),
  evaluateResponsibilityAccess: vi.fn(),
  buildProjectLineItemsViewModel: vi.fn(),
  buildTasksViewModel: vi.fn(),
  listProjectLineItemsByCustomer: vi.fn(),
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
  () => ({
    listCockpitProjectsByCustomer: mocks.listCockpitProjectsByCustomer,
  }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-customer-access-scopes.query-handler",
  () => ({ listCustomerAccessScopes: mocks.listCustomerAccessScopes }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-access-customer-projects.query-handler",
  () => ({ listAccessCustomerProjects: mocks.listAccessCustomerProjects }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-workspace-members.query-handler",
  () => ({ listWorkspaceMembers: mocks.listWorkspaceMembers }),
);
vi.mock(
  "@/server/workspace/access/query-handler/list-role-assignment-options.query-handler",
  () => ({ listRoleAssignmentOptions: mocks.listRoleAssignmentOptions }),
);
vi.mock(
  "@/server/workspace/shared/services/responsibility-access-service",
  () => ({
    responsibilityAccessService: {
      evaluate: mocks.evaluateResponsibilityAccess,
    },
  }),
);
vi.mock("@/lib/workspace/crm/project-line-items-view-model", () => ({
  buildProjectLineItemsViewModel: mocks.buildProjectLineItemsViewModel,
}));
vi.mock("@/lib/workspace/crm/tasks-view-model", () => ({
  buildTasksViewModel: mocks.buildTasksViewModel,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-project-line-items-by-customer.query-handler",
  () => ({
    listProjectLineItemsByCustomer: mocks.listProjectLineItemsByCustomer,
  }),
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
    CustomersBasicList: ({
      writableCustomerIds,
    }: {
      writableCustomerIds: ReadonlySet<string>;
    }) => (
      <div
        data-testid="list"
        data-writable-customer-ids={[...writableCustomerIds].join(",")}
      />
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
    mocks.listCustomers.mockResolvedValue({
      hasCustomers: true,
      page: 1,
      perPage: 25,
      rows: [customerDetailFixture()],
      total: 1,
    });
    mocks.listCategories.mockResolvedValue([]);
    mocks.listCockpitProjectsByCustomer.mockResolvedValue([]);
    mocks.listProjectLineItemsByCustomer.mockResolvedValue([]);
    mocks.listCustomerAccessScopes.mockResolvedValue([]);
    mocks.listAccessCustomerProjects.mockResolvedValue([]);
    mocks.listWorkspaceMembers.mockResolvedValue([]);
    mocks.listRoleAssignmentOptions.mockResolvedValue([]);
    mocks.evaluateResponsibilityAccess.mockResolvedValue({
      countByMemberId: {},
      inaccessibleEntityIds: new Set(),
      targets: [],
    });
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
      "data-writable-customer-ids",
      TEST_CUSTOMER_ID,
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
      "data-writable-customer-ids",
      "",
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });

  it("keeps a customer reached only through a project grant out of the writable set", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue({
      ...workspaceActorWith([Permission.CustomersRead]),
      projectPermissions: new Map([
        [
          "project-1",
          {
            customerId: TEST_CUSTOMER_ID,
            permissions: new Set([Permission.CustomersWrite]),
          },
        ],
      ]),
    });

    await renderPage();

    expect(screen.getByTestId("list")).toHaveAttribute(
      "data-writable-customer-ids",
      "",
    );
  });

  it("opens the read-only cockpit without customers.write", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue(
      workspaceActorWith([Permission.CustomersRead]),
    );
    mocks.getCustomerCockpitById.mockResolvedValue({ id: TEST_CUSTOMER_ID });

    await renderPage({ cockpit: TEST_CUSTOMER_ID });

    expect(screen.getByTestId("cockpit")).toBeInTheDocument();
    expect(mocks.getCustomerCockpitById).toHaveBeenCalledWith(
      TEST_CUSTOMER_ID,
      expect.anything(),
    );
  });

  it("loads projects through project-line-items.read without projects.read", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue(
      workspaceActorWith([Permission.ProjectLineItemsRead]),
    );
    mocks.getCustomerCockpitById.mockResolvedValue({ id: TEST_CUSTOMER_ID });

    await renderPage({ cockpit: TEST_CUSTOMER_ID });

    expect(mocks.listCockpitProjectsByCustomer).toHaveBeenCalledWith(
      TEST_CUSTOMER_ID,
      expect.anything(),
    );
    expect(mocks.buildProjectLineItemsViewModel).toHaveBeenCalledWith(
      expect.objectContaining({ projects: [] }),
    );
  });

  it("builds the task view model from the cockpit projects and the actor", async () => {
    const actor = workspaceActorWith([Permission.TasksRead]);
    mocks.requireWorkspaceArea.mockResolvedValue(actor);
    mocks.getCustomerCockpitById.mockResolvedValue({ id: TEST_CUSTOMER_ID });

    await renderPage({ cockpit: TEST_CUSTOMER_ID });

    expect(mocks.buildTasksViewModel).toHaveBeenCalledWith({
      actor,
      customerId: TEST_CUSTOMER_ID,
      projects: [],
    });
  });

  it("does not build task data without an open cockpit", async () => {
    await renderPage();

    expect(mocks.buildTasksViewModel).not.toHaveBeenCalled();
  });

  it("returns not found for an inaccessible cockpit customer", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue(
      workspaceActorWith([Permission.CustomersRead]),
    );
    mocks.getCustomerCockpitById.mockResolvedValue(null);

    await expect(
      CrmPage({
        params: Promise.resolve({ locale: "de" }),
        searchParams: Promise.resolve({ cockpit: TEST_CUSTOMER_ID }),
      }),
    ).rejects.toThrow("notFound called");
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

  it("opens nothing for an edit request on a customer the member cannot write to", async () => {
    mocks.requireWorkspaceArea.mockResolvedValue(
      workspaceActorWith([Permission.CustomersRead]),
    );

    await renderPage({ mode: "edit", edit: TEST_CUSTOMER_ID });

    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    expect(mocks.getCustomerById).not.toHaveBeenCalled();
  });
});
