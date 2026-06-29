// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KlarkompassHeader } from "./klarkompass-header";

const navItems = [
  { href: "kk-problem", label: "Herausforderung" },
  { href: "kk-faq", label: "FAQ" },
];

afterEach(cleanup);

describe("KlarkompassHeader", () => {
  it("toggles the mobile menu open and closed", () => {
    render(
      <KlarkompassHeader
        brand="KlarKompass"
        ctaAlertMessage="Demo alert"
        ctaHref="#kk-contact"
        ctaLabel="Kostenloses Erstgespräch buchen"
        homeHref="#kk-hero"
        menuCloseLabel="Menü schließen"
        menuOpenLabel="Menü öffnen"
        navItems={navItems}
      />,
    );

    const openToggle = screen.getByRole("button", { name: "Menü öffnen" });
    expect(openToggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(openToggle);

    const closeToggle = screen.getByRole("button", { name: "Menü schließen" });
    expect(closeToggle.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(closeToggle);
    expect(
      screen
        .getByRole("button", { name: "Menü öffnen" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });
});
