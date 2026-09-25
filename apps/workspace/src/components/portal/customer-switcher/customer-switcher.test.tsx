// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import { getPortalShellDictionary } from "@/i18n/dictionaries/portal";
import { CustomerSwitcher } from "./customer-switcher";

const CONTENT = getPortalShellDictionary("de").switcher;

const COMPANY_A: PortalMembershipOptionDto = {
  customerId: "customer-a",
  displayName: "Nordlicht Coaching",
};
const COMPANY_B: PortalMembershipOptionDto = {
  customerId: "customer-b",
  displayName: "Südwind Beratung",
};

describe("CustomerSwitcher", () => {
  afterEach(cleanup);

  it("shows the company name as plain text with only one membership", () => {
    render(
      <CustomerSwitcher
        activeCustomerId={COMPANY_A.customerId}
        companies={[COMPANY_A]}
        content={CONTENT}
        locale="de"
      />,
    );

    expect(screen.getByText("Nordlicht Coaching")).toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("keeps the visible company name in the disclosure's accessible name", () => {
    const { container } = render(
      <CustomerSwitcher
        activeCustomerId={COMPANY_A.customerId}
        companies={[COMPANY_A, COMPANY_B]}
        content={CONTENT}
        locale="de"
      />,
    );

    expect(container.querySelector("summary")).toHaveAccessibleName(
      /Nordlicht Coaching/,
    );
  });

  it("links to every other active company", () => {
    render(
      <CustomerSwitcher
        activeCustomerId={COMPANY_A.customerId}
        companies={[COMPANY_A, COMPANY_B]}
        content={CONTENT}
        locale="de"
      />,
    );

    const link = screen.getByRole("link", { name: "Südwind Beratung" });
    expect(link).toHaveAttribute("href", "/de/portal/customer-b");
  });

  it("marks the active company and does not link it to itself", () => {
    render(
      <CustomerSwitcher
        activeCustomerId={COMPANY_A.customerId}
        companies={[COMPANY_A, COMPANY_B]}
        content={CONTENT}
        locale="de"
      />,
    );

    expect(
      screen.queryByRole("link", { name: /Nordlicht Coaching/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Nordlicht Coaching").length).toBeGreaterThan(0);
  });
});
