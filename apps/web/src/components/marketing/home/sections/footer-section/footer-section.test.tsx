// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FooterSection } from "./footer-section";

afterEach(() => {
  cleanup();
});

function renderFooter() {
  return render(
    <FooterSection
      description="Schnellzugriff"
      locale="de"
      navColumn={{
        title: "Navigation",
        links: [{ href: "#references", label: "Ergebnisse" }],
      }}
    />,
  );
}

describe("FooterSection", () => {
  it("renders nav column, static columns, description, and copyright", () => {
    renderFooter();

    expect(
      screen.getByRole("link", { name: "Ergebnisse" }).getAttribute("href"),
    ).toBe("#references");
    expect(screen.getByText("Schnellzugriff")).toBeTruthy();
    expect(
      screen.getByText("© 2026 Invessiv. Alle Rechte vorbehalten."),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Referenzen" }).getAttribute("href"),
    ).toBe("/de/references");
    expect(
      screen.getByRole("link", { name: "Invessiv" }).getAttribute("href"),
    ).toBe("/de/imprint#company-details");
    expect(screen.getByText("Moritz Hecht")).toBeTruthy();
  });

  it("keeps the contact column free of spelled-out values", () => {
    renderFooter();

    expect(screen.queryByText("service@invessiv.com")).toBeNull();
    expect(screen.queryByText("+49 1523 2070477")).toBeNull();
  });

  it("offers all four channels as icon-only buttons below", () => {
    renderFooter();

    const shortcuts = screen.getByRole("list", { name: "Kontaktwege" });
    const links = within(shortcuts).getAllByRole("link");

    expect(links).toHaveLength(4);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "mailto:service@invessiv.com",
      "tel:+4915232070477",
      "https://www.linkedin.com/in/moritz-hecht-4a5200235/",
      "https://www.instagram.com/invessiv/",
    ]);

    // Icon-only: the buttons carry no visible label text.
    expect(shortcuts.textContent).toBe("");
    expect(
      within(shortcuts).getByRole("link", { name: "E-Mail schreiben" }),
    ).toBeTruthy();
  });

  it("tracks every contact channel as a contact click from the footer", () => {
    renderFooter();

    const shortcuts = screen.getByRole("list", { name: "Kontaktwege" });
    const email = within(shortcuts).getByRole("link", {
      name: "E-Mail schreiben",
    });

    expect(email.getAttribute("data-analytics-event")).toBe("contact_click");
    expect(email.getAttribute("data-analytics-location")).toBe("footer");
    expect(email.getAttribute("data-analytics-target")).toBe("email");

    expect(
      within(shortcuts)
        .getByRole("link", { name: "LinkedIn-Profil öffnen" })
        .getAttribute("data-analytics-target"),
    ).toBe("linkedin");
  });
});
