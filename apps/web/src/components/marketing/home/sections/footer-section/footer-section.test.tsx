// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FooterSection } from "./footer-section";

describe("FooterSection", () => {
  it("renders nav column, static columns, description, and copyright", () => {
    render(
      <FooterSection
        description="Schnellzugriff"
        locale="de"
        navColumn={{
          title: "Navigation",
          links: [{ href: "#proof", label: "Ergebnisse" }],
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Ergebnisse" }).getAttribute("href"),
    ).toBe("#proof");
    expect(screen.getByText("Schnellzugriff")).toBeTruthy();
    expect(
      screen.getByText("© 2026 Invessiv. Alle Rechte vorbehalten."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "LinkedIn" })).toBeTruthy();
    expect(screen.getAllByText("Invessiv").length).toBeGreaterThan(0);
  });
});
