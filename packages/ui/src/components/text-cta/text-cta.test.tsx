// @vitest-environment jsdom
import type { ButtonLinkComponentProps } from "@invessiv/common/contracts/ui/button-link-component-props";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuaternaryCta, TertiaryCta, TextCta } from "@invessiv/ui";

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

describe("TextCta", () => {
  it("preserves the link target and tracking without adding the decorative arrow to its name", () => {
    render(
      <TextCta
        arrow
        href="/de/references"
        data-analytics-event="reference_opened"
      >
        Projekt ansehen
      </TextCta>,
    );
    const link = screen.getByRole("link", { name: "Projekt ansehen" });
    expect(link.getAttribute("href")).toBe("/de/references");
    expect(link.getAttribute("data-analytics-event")).toBe("reference_opened");
  });

  it("renders through an injected framework link", () => {
    render(
      <TertiaryCta href="/de/references" linkComponent={FrameworkLink}>
        Projekt ansehen
      </TertiaryCta>,
    );
    const link = screen.getByRole("link", { name: "Projekt ansehen" });
    expect(link.getAttribute("data-framework-link")).toBe("true");
    expect(link.getAttribute("href")).toBe("/de/references");
  });

  it("keeps a button action out of the surrounding form submission", () => {
    const onClick = vi.fn();
    render(
      <QuaternaryCta as="button" onClick={onClick}>
        Mehr lesen
      </QuaternaryCta>,
    );
    const button = screen.getByRole("button", { name: "Mehr lesen" });
    expect(button.getAttribute("type")).toBe("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("retains the native disclosure element for complete quotes", () => {
    render(
      <details>
        <QuaternaryCta as="summary">Ganzes Zitat lesen</QuaternaryCta>
        <p>Originalzitat</p>
      </details>,
    );
    const summary = screen.getByText("Ganzes Zitat lesen").closest("summary");
    expect(summary?.parentElement?.tagName).toBe("DETAILS");
    fireEvent.click(summary!);
    expect(summary?.parentElement?.hasAttribute("open")).toBe(true);
  });

  it("gives each named level its own variant", () => {
    render(
      <>
        <TertiaryCta href="#a">Dritte Stufe</TertiaryCta>
        <QuaternaryCta href="#b">Vierte Stufe</QuaternaryCta>
      </>,
    );
    expect(
      screen.getByRole("link", { name: "Dritte Stufe" }).className,
    ).toMatch(/tertiary/);
    expect(
      screen.getByRole("link", { name: "Vierte Stufe" }).className,
    ).toMatch(/quaternary/);
  });
});
