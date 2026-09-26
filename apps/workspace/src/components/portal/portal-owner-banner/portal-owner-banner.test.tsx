// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getPortalShellDictionary } from "@/i18n/dictionaries/portal";
import { PortalOwnerBanner } from "./portal-owner-banner";

const CONTENT = getPortalShellDictionary("de").ownerView;

describe("PortalOwnerBanner", () => {
  afterEach(cleanup);

  it("names the company, states read-only and links back to the CRM", () => {
    render(
      <PortalOwnerBanner
        cockpitHref="/de/crm?cockpit=customer-1"
        companyName="Kanzlei Müller"
        content={CONTENT}
      />,
    );

    const banner = screen.getByRole("complementary", { name: CONTENT.label });
    expect(banner).toHaveTextContent(`${CONTENT.label} Kanzlei Müller`);
    expect(banner).toHaveTextContent(CONTENT.hint);
    expect(
      screen.getByRole("link", { name: CONTENT.cockpitLink }),
    ).toHaveAttribute("href", "/de/crm?cockpit=customer-1");
  });
});
