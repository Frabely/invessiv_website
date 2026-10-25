// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleSwitch } from "@invessiv/ui";

afterEach(cleanup);

function renderOpenSwitcher() {
  const onSelectAction = vi.fn();
  render(
    <>
      <LocaleSwitch
        locale="de"
        localeMenuLabel="Select language"
        localeSwitchLabel="Languages"
        onSelectAction={onSelectAction}
      />
      <button type="button">Outside</button>
    </>,
  );
  const summary = screen.getByLabelText("Select language");
  const details = summary.closest("details")!;
  fireEvent.click(summary);
  expect(details.open).toBe(true);
  return { summary, details, onSelectAction };
}

describe("LocaleSwitch dismissal", () => {
  it.each(["mouse", "touch"])(
    "closes on an outside %s interaction without selecting a language",
    (pointerType) => {
      const { details, onSelectAction } = renderOpenSwitcher();
      fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }), {
        pointerType,
      });
      expect(details.open).toBe(false);
      expect(onSelectAction).not.toHaveBeenCalled();
    },
  );

  it("keeps the menu open for interactions inside it and preserves selection", () => {
    const { details, onSelectAction } = renderOpenSwitcher();
    const option = screen.getByRole("button", { name: "EN" });
    fireEvent.pointerDown(option);
    expect(details.open).toBe(true);
    fireEvent.click(option);
    expect(onSelectAction).toHaveBeenCalledWith("en", expect.anything());
  });

  it("closes with Escape and returns focus to the trigger", () => {
    const { details, summary } = renderOpenSwitcher();
    const option = screen.getByRole("button", { name: "EN" });
    option.focus();
    fireEvent.keyDown(option, { key: "Escape" });
    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(summary);
  });

  it("closes when keyboard focus leaves the menu without stealing focus", () => {
    const { details } = renderOpenSwitcher();
    const outside = screen.getByRole("button", { name: "Outside" });
    outside.focus();
    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(outside);
  });
});
