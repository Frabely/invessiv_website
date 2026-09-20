// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getCrmListDictionary } from "@/i18n/dictionaries/workspace/crm";
import {
  customerDetailFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomersBasicList } from "./customers-basic-list";

const content = getCrmListDictionary("de");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("CustomersBasicList", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows number, name, status and primary contact", () => {
    render(
      <CustomersBasicList
        basePath="/de/crm"
        content={content}
        createHref="/de/crm?mode=create"
        customers={[customerDetailFixture({ status: "paused" })]}
        filteredEmptyHref="/de/crm?archived=true"
        hasCustomers
        locale="de"
        queryString=""
        writableCustomerIds={new Set([TEST_CUSTOMER_ID])}
      />,
    );

    expect(screen.getByText("K0007")).toBeInTheDocument();
    expect(
      screen.getByRole("rowheader", { name: /Nordlicht Coaching/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(content.status.paused).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("Anna Berger")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.columns.actions }),
    ).toHaveAttribute("aria-controls", `customer-${TEST_CUSTOMER_ID}-actions`);
    expect(
      screen.getByRole("link", { name: "Nordlicht Coaching bearbeiten" }),
    ).toHaveAttribute("href", `/de/crm?mode=edit&edit=${TEST_CUSTOMER_ID}`);
  });

  it("keeps the cockpit action but hides editing without write access", () => {
    render(
      <CustomersBasicList
        basePath="/de/crm"
        content={content}
        createHref={null}
        customers={[customerDetailFixture()]}
        filteredEmptyHref="/de/crm?archived=true"
        hasCustomers
        locale="de"
        queryString=""
        writableCustomerIds={new Set()}
      />,
    );

    expect(
      screen.getByRole("link", {
        name: "Kundenansicht für Nordlicht Coaching öffnen",
      }),
    ).toHaveAttribute("href", `/de/crm?cockpit=${TEST_CUSTOMER_ID}`);
    expect(
      screen.queryByRole("link", { name: "Nordlicht Coaching bearbeiten" }),
    ).not.toBeInTheDocument();
  });

  it("only offers editing for the rows the member may actually write to", () => {
    const otherCustomerId = "1c9b6a8f-4e3e-4d2c-8b9f-8e7d6c5b4a32";
    render(
      <CustomersBasicList
        basePath="/de/crm"
        content={content}
        createHref={null}
        customers={[
          customerDetailFixture(),
          customerDetailFixture({
            id: otherCustomerId,
            displayName: "Südwind Consulting",
          }),
        ]}
        filteredEmptyHref="/de/crm?archived=true"
        hasCustomers
        locale="de"
        queryString=""
        writableCustomerIds={new Set([TEST_CUSTOMER_ID])}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Nordlicht Coaching bearbeiten" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Südwind Consulting bearbeiten" }),
    ).not.toBeInTheDocument();
  });

  it("explains the area in the empty state and offers creation", () => {
    render(
      <CustomersBasicList
        basePath="/de/crm"
        content={content}
        createHref="/de/crm?mode=create"
        customers={[]}
        filteredEmptyHref="/de/crm?archived=true"
        hasCustomers={false}
        locale="de"
        queryString=""
        writableCustomerIds={new Set()}
      />,
    );

    expect(screen.getByText(content.empty.description)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.empty.action }),
    ).toHaveAttribute("href", "/de/crm?mode=create");
  });

  it("offers archived customers instead of creation for a filtered empty list", () => {
    render(
      <CustomersBasicList
        basePath="/de/crm"
        content={content}
        createHref="/de/crm?mode=create"
        customers={[]}
        filteredEmptyHref="/de/crm?archived=true"
        hasCustomers
        locale="de"
        queryString=""
        writableCustomerIds={new Set()}
      />,
    );

    expect(screen.getByText(content.noResults.description)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.noResults.action }),
    ).toHaveAttribute("href", "/de/crm?archived=true");
    expect(
      screen.queryByRole("link", { name: content.empty.action }),
    ).not.toBeInTheDocument();
  });
});
