// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { customerDetailFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";
import { CustomerCockpitView } from "./customer-cockpit-view";

describe("CustomerCockpitView", () => {
  afterEach(cleanup);

  it("renders the shared compact customer state without a dialog shell", () => {
    const customer = customerDetailFixture({ status: "paused" });
    const content = getCrmCockpitDictionary("en");

    render(<CustomerCockpitView content={content} customer={customer} />);

    expect(screen.getByText("K0007")).toBeInTheDocument();
    expect(screen.getByText(customer.displayName)).toBeInTheDocument();
    expect(screen.getByText(content.status.paused)).toBeInTheDocument();
    expect(screen.getByText(customer.ownerDisplayName)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: customer.primaryContactEmail ?? "" }),
    ).toHaveAttribute("href", `mailto:${customer.primaryContactEmail}`);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
