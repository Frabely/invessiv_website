// @vitest-environment jsdom
import type { ButtonLinkComponentProps } from "@invessiv/common/contracts/ui/button-link-component-props";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Breadcrumbs } from "@invessiv/ui";

function FrameworkLink({ children, ...props }: ButtonLinkComponentProps) {
  return (
    <a {...props} data-framework-link="true">
      {children}
    </a>
  );
}

afterEach(() => {
  cleanup();
});

describe("Breadcrumbs", () => {
  it("links every entry but the last, which is marked as the current page", () => {
    render(
      <Breadcrumbs
        items={[
          { href: "/de", label: "Start" },
          { href: "/de/terms", label: "AGB" },
        ]}
        navLabel="Breadcrumb"
      />,
    );

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      screen.getByRole("link", { name: "Start" }).getAttribute("href"),
    ).toBe("/de");
    expect(screen.queryByRole("link", { name: "AGB" })).toBeNull();
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe("AGB");
  });

  it("renders links through an injected framework link", () => {
    render(
      <Breadcrumbs
        items={[{ href: "/de", label: "Start" }, { label: "AGB" }]}
        linkComponent={FrameworkLink}
        navLabel="Breadcrumb"
      />,
    );

    expect(
      screen
        .getByRole("link", { name: "Start" })
        .getAttribute("data-framework-link"),
    ).toBe("true");
  });

  it("lets the caller render the current page, e.g. as the page heading", () => {
    render(
      <Breadcrumbs
        items={[{ href: "/de", label: "Überblick" }, { label: "Onboarding" }]}
        navLabel="Breadcrumb"
        renderCurrent={(label) => <h1>{label}</h1>}
      />,
    );

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Onboarding",
    });
    expect(heading.closest('[aria-current="page"]')).not.toBeNull();
  });
});
