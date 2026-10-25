// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

  it("closes on Escape and returns focus to the summary", () => {
    const { container } = render(
      <CustomerSwitcher
        activeCustomerId={COMPANY_A.customerId}
        companies={[COMPANY_A, COMPANY_B]}
        content={CONTENT}
        locale="de"
      />,
    );
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(details.open).toBe(false);
    expect(container.querySelector("summary")).toHaveFocus();
  });

  it("closes when a pointer is pressed outside the company menu", () => {
    const { container } = render(
      <CustomerSwitcher
        activeCustomerId={COMPANY_A.customerId}
        companies={[COMPANY_A, COMPANY_B]}
        content={CONTENT}
        locale="en"
      />,
    );
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent.pointerDown(document.body);
    expect(details.open).toBe(false);
  });

  it("links the single company name to the overview", () => {
    render(
      <CustomerSwitcher
        activeCustomerId={COMPANY_A.customerId}
        companies={[COMPANY_A]}
        content={CONTENT}
        locale="de"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Nordlicht Coaching" }),
    ).toHaveAttribute("href", "/de/portal/customer-a");
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("names the disclosure by its action", () => {
    const { container } = render(
      <CustomerSwitcher
        activeCustomerId={COMPANY_A.customerId}
        companies={[COMPANY_A, COMPANY_B]}
        content={CONTENT}
        locale="de"
      />,
    );

    expect(container.querySelector("summary")).toHaveAccessibleName(
      /Firma wechseln/,
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

  it("links the active company name to its overview", () => {
    render(
      <CustomerSwitcher
        activeCustomerId={COMPANY_A.customerId}
        companies={[COMPANY_A, COMPANY_B]}
        content={CONTENT}
        locale="de"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Nordlicht Coaching" }),
    ).toHaveAttribute("href", "/de/portal/customer-a");
    expect(screen.getAllByText("Nordlicht Coaching").length).toBeGreaterThan(0);
  });
});
