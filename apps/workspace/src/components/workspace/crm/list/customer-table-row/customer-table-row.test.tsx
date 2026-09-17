// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getCrmListDictionary } from "@/i18n/dictionaries/workspace/crm";
import {
  customerDetailFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomerTableRow } from "./customer-table-row";

const content = getCrmListDictionary("de");

function renderRow(canWrite: boolean) {
  render(
    <table>
      <tbody>
        <CustomerTableRow
          basePath="/de/crm"
          canWrite={canWrite}
          content={content}
          customer={customerDetailFixture({ status: "paused" })}
          locale="de"
          queryString="page=2&sort=name_asc"
        />
      </tbody>
    </table>,
  );
}

describe("CustomerTableRow", () => {
  afterEach(cleanup);

  it("renders customer data and preserves list state in the edit target", () => {
    renderRow(true);

    expect(screen.getByText("K0007")).toBeInTheDocument();
    expect(screen.getByText("Anna Berger")).toBeInTheDocument();
    expect(screen.getByText(content.status.paused)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Nordlicht Coaching bearbeiten" }),
    ).toHaveAttribute(
      "href",
      `/de/crm?page=2&sort=name_asc&mode=edit&edit=${TEST_CUSTOMER_ID}`,
    );
  });

  it("keeps the cockpit action but hides editing without write permission", () => {
    renderRow(false);

    expect(
      screen.getByRole("link", {
        name: "Kundenansicht für Nordlicht Coaching öffnen",
      }),
    ).toHaveAttribute(
      "href",
      `/de/crm?page=2&sort=name_asc&cockpit=${TEST_CUSTOMER_ID}`,
    );
    expect(
      screen.queryByRole("link", { name: "Nordlicht Coaching bearbeiten" }),
    ).not.toBeInTheDocument();
  });
});
