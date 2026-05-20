// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ButtonControl,
  ButtonLink,
  PrimaryCtaButton,
  PrimaryCtaLink,
} from "./button";

describe("shared button", () => {
  it("renders primary links and buttons through the shared CTA wrappers", () => {
    render(
      <>
        <PrimaryCtaLink href="/de#contact">Projekt anfragen</PrimaryCtaLink>
        <PrimaryCtaButton type="button">Weiter</PrimaryCtaButton>
      </>,
    );

    expect(
      screen.getByRole("link", { name: "Projekt anfragen" }).className,
    ).toContain("button");
    expect(
      screen.getByRole("link", { name: "Projekt anfragen" }).className,
    ).toContain("primary");
    expect(screen.getByRole("button", { name: "Weiter" }).className).toContain(
      "button",
    );
    expect(screen.getByRole("button", { name: "Weiter" }).className).toContain(
      "primary",
    );
  });

  it("keeps the generic shared button variants available", () => {
    render(
      <>
        <ButtonLink href="/de#services" variant="ghost">
          Leistungen ansehen
        </ButtonLink>
        <ButtonControl type="button" variant="ghost">
          Zurueck
        </ButtonControl>
      </>,
    );

    expect(
      screen.getByRole("link", { name: "Leistungen ansehen" }).className,
    ).toContain("button");
    expect(
      screen.getByRole("link", { name: "Leistungen ansehen" }).className,
    ).toContain("ghost");
    expect(screen.getByRole("button", { name: "Zurueck" }).className).toContain(
      "button",
    );
    expect(screen.getByRole("button", { name: "Zurueck" }).className).toContain(
      "ghost",
    );
  });
});
