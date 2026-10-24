// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DisclosureButton } from "./disclosure-button";

describe("DisclosureButton", () => {
  it("preserves expansion semantics and invokes its toggle without submitting a form", () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <DisclosureButton
        expanded={false}
        aria-controls="questions"
        onClick={onClick}
      >
        Mehr Fragen anzeigen
      </DisclosureButton>,
    );
    const button = screen.getByRole("button", { name: "Mehr Fragen anzeigen" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-controls")).toBe("questions");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    rerender(
      <DisclosureButton expanded aria-controls="questions" onClick={onClick}>
        Weniger Fragen anzeigen
      </DisclosureButton>,
    );
    expect(
      screen
        .getByRole("button", { name: "Weniger Fragen anzeigen" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });
});
