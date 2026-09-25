// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PortalMembershipOptionDto } from "@invessiv/common/contracts/portal/portal-membership-option.dto";
import { getPortalPickerDictionary } from "@/i18n/dictionaries/portal";
import { PortalCompanyPicker } from "./portal-company-picker";

const CONTENT = getPortalPickerDictionary("de");

const COMPANIES: PortalMembershipOptionDto[] = [
  { customerId: "customer-a", displayName: "Nordlicht Coaching" },
  { customerId: "customer-b", displayName: "Südwind Beratung" },
];

describe("PortalCompanyPicker", () => {
  afterEach(cleanup);

  it("renders the title and a link per company", () => {
    render(
      <PortalCompanyPicker
        companies={COMPANIES}
        content={CONTENT}
        locale="de"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Firma wählen" }),
    ).toBeInTheDocument();

    const list = screen.getByRole("list", { name: "Verfügbare Firmen" });
    expect(list).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Nordlicht Coaching" }),
    ).toHaveAttribute("href", "/de/portal/customer-a");
    expect(
      screen.getByRole("link", { name: "Südwind Beratung" }),
    ).toHaveAttribute("href", "/de/portal/customer-b");
  });
});
