// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextCta } from "./text-cta";

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

  it("keeps a button action out of the surrounding form submission", () => {
    const onClick = vi.fn();
    render(
      <TextCta as="button" variant="quaternary" onClick={onClick}>
        Mehr lesen
      </TextCta>,
    );
    const button = screen.getByRole("button", { name: "Mehr lesen" });
    expect(button.getAttribute("type")).toBe("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("retains the native disclosure element for complete quotes", () => {
    render(
      <details>
        <TextCta as="summary" variant="quaternary">
          Ganzes Zitat lesen
        </TextCta>
        <p>Originalzitat</p>
      </details>,
    );
    const summary = screen.getByText("Ganzes Zitat lesen").closest("summary");
    expect(summary?.parentElement?.tagName).toBe("DETAILS");
    fireEvent.click(summary!);
    expect(summary?.parentElement?.hasAttribute("open")).toBe(true);
  });
});
