// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  ButtonControl,
  ButtonLink,
  PrimaryCtaButton,
  PrimaryCtaLink,
} from "@invessiv/ui";

describe("shared button", () => {
  it("keeps list-row actions accessible and respects the native disabled state", () => {
    const onClick = vi.fn();
    render(
      <ButtonControl
        aria-label="Choose service"
        disabled
        onClick={onClick}
        type="button"
        variant="row"
      >
        <span aria-hidden="true">+</span>
        <span>Service</span>
        <span aria-hidden="true">›</span>
      </ButtonControl>,
    );
    const button = screen.getByRole("button", { name: "Choose service" });
    expect(button.className).toContain("row");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
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
          Zurück
        </ButtonControl>
      </>,
    );

    expect(
      screen.getByRole("link", { name: "Leistungen ansehen" }).className,
    ).toContain("button");
    expect(
      screen.getByRole("link", { name: "Leistungen ansehen" }).className,
    ).toContain("ghost");
    expect(screen.getByRole("button", { name: "Zurück" }).className).toContain(
      "button",
    );
    expect(screen.getByRole("button", { name: "Zurück" }).className).toContain(
      "ghost",
    );
  });

  it("uses an injected link component without losing anchor props or refs", () => {
    const TestLink = forwardRef<HTMLAnchorElement, React.ComponentProps<"a">>(
      function TestLink(props, ref) {
        return <a {...props} data-link-component="test" ref={ref} />;
      },
    );
    const ref = { current: null as HTMLAnchorElement | null };

    render(
      <ButtonLink
        aria-label="Projekt öffnen"
        href="/de/projects/1"
        linkComponent={TestLink}
        linkComponentProps={{ "data-scroll-disabled": "true" }}
        ref={ref}
      >
        Projekt
      </ButtonLink>,
    );

    const link = screen.getByRole("link", { name: "Projekt öffnen" });
    expect(link.getAttribute("data-link-component")).toBe("test");
    expect(link.getAttribute("data-scroll-disabled")).toBe("true");
    expect(link.getAttribute("href")).toBe("/de/projects/1");
    expect(ref.current).toBe(link);
  });
});
