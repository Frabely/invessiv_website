// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getCrmListDictionary } from "@/i18n/dictionaries/workspace/crm";
import {
  customerDetailFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomersBasicList } from "./customers-basic-list";

const content = getCrmListDictionary("de");

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
      />,
    );

    expect(screen.getByText("K0007")).toBeInTheDocument();
    expect(
      screen.getByRole("rowheader", { name: /Nordlicht Coaching/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.status.paused)).toBeInTheDocument();
    expect(screen.getByText("Anna Berger")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Nordlicht Coaching bearbeiten" }),
    ).toHaveAttribute("href", `/de/crm?mode=edit&edit=${TEST_CUSTOMER_ID}`);
  });

  it("renders no edit action without write access", () => {
    render(
      <CustomersBasicList
        basePath={null}
        content={content}
        createHref={null}
        customers={[customerDetailFixture()]}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("explains the area in the empty state and offers creation", () => {
    render(
      <CustomersBasicList
        basePath="/de/crm"
        content={content}
        createHref="/de/crm?mode=create"
        customers={[]}
      />,
    );

    expect(screen.getByText(content.empty.description)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.empty.action }),
    ).toHaveAttribute("href", "/de/crm?mode=create");
  });
});
