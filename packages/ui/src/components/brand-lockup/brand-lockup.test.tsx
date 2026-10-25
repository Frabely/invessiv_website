// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BrandLockup } from "@invessiv/ui";

afterEach(() => {
  cleanup();
});

describe("BrandLockup", () => {
  it("renders the shared logo next to the wordmark", () => {
    render(<BrandLockup label="Invessiv" logoAlt="Invessiv Logo" priority />);

    const logo = screen.getByRole("img", { name: "Invessiv Logo" });
    expect(logo).toHaveAttribute(
      "src",
      "/brand/invessiv-logo-mehr-abstand.svg",
    );
    expect(logo).toHaveAttribute("fetchpriority", "high");
    expect(screen.getByText("Invessiv")).toBeInTheDocument();
  });

  it("marks the label as collapsible only when asked to", () => {
    const { container, rerender } = render(
      <BrandLockup label="Invessiv" logoAlt="" />,
    );
    expect(container.firstElementChild).not.toHaveAttribute(
      "data-collapse-label",
    );

    rerender(<BrandLockup collapseLabelOnMobile label="Invessiv" logoAlt="" />);
    expect(container.firstElementChild).toHaveAttribute(
      "data-collapse-label",
      "true",
    );
  });

  it("accepts an application-specific logo without changing the shared default", () => {
    const { rerender } = render(
      <BrandLockup
        label="Invessiv"
        logoAlt="Brand"
        logoSrc="/custom-brand.svg"
        logoWidth={160}
        logoHeight={100}
      />,
    );
    expect(screen.getByRole("img", { name: "Brand" })).toHaveAttribute(
      "src",
      "/custom-brand.svg",
    );
    expect(screen.getByRole("img", { name: "Brand" })).toHaveAttribute(
      "width",
      "160",
    );
    expect(screen.getByRole("img", { name: "Brand" })).toHaveAttribute(
      "height",
      "100",
    );
    rerender(<BrandLockup label="Invessiv" logoAlt="Brand" />);
    expect(screen.getByRole("img", { name: "Brand" })).toHaveAttribute(
      "src",
      "/brand/invessiv-logo-mehr-abstand.svg",
    );
    expect(screen.getByRole("img", { name: "Brand" })).toHaveAttribute(
      "width",
      "1562",
    );
    expect(screen.getByRole("img", { name: "Brand" })).toHaveAttribute(
      "height",
      "1333",
    );
  });
});
