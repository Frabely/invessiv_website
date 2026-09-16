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
        canWrite
        content={content}
        createHref="/de/crm?mode=create"
        customers={[customerDetailFixture({ status: "paused" })]}
        locale="de"
        queryString=""
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

  it("renders no edit action without write access", () => {
    render(
      <CustomersBasicList
        basePath="/de/crm"
        canWrite={false}
        content={content}
        createHref={null}
        customers={[customerDetailFixture()]}
        locale="de"
        queryString=""
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("explains the area in the empty state and offers creation", () => {
    render(
      <CustomersBasicList
        basePath="/de/crm"
        canWrite
        content={content}
        createHref="/de/crm?mode=create"
        customers={[]}
        locale="de"
        queryString=""
      />,
    );

    expect(screen.getByText(content.empty.description)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.empty.action }),
    ).toHaveAttribute("href", "/de/crm?mode=create");
  });
});
