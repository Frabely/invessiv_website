// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { formatCustomerNumber } from "@invessiv/common/patterns/crm/format-customer-number";
import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { customerDetailFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomerCockpitDialog } from "./customer-cockpit-dialog";

const navigation = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

describe("CustomerCockpitDialog", () => {
  afterEach(cleanup);

  it("names the customer once in the dialog chrome and closes through the header", () => {
    const customer = customerDetailFixture();
    const content = getCrmCockpitDictionary("de");

    render(
      <CustomerCockpitDialog
        closeHref="/de/crm"
        content={content}
        customer={customer}
        locale="de"
        projects={[]}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: customer.displayName });
    expect(dialog).toHaveTextContent(
      formatCustomerNumber(customer.customerNumber),
    );
    expect(
      screen.getAllByRole("heading", { name: customer.displayName }),
    ).toHaveLength(1);
    expect(dialog.querySelector("footer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: content.close }));
    expect(navigation.replace).toHaveBeenCalledWith("/de/crm", {
      scroll: false,
    });
  });
});
