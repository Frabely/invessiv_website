// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DurationInput } from "@invessiv/ui";

class TestPointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  isPrimary: boolean;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? "touch";
    this.isPrimary = init.isPrimary ?? true;
  }
}
beforeEach(() => {
  vi.stubGlobal("PointerEvent", TestPointerEvent);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function Example({
  initial = "",
  minuteStep = 15,
  maxMinutes = 600,
}: {
  initial?: string;
  minuteStep?: number;
  maxMinutes?: number;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <DurationInput
        id="duration"
        hoursLabel="Hours"
        minutesLabel="Minutes"
        increaseHoursLabel="More hours"
        decreaseHoursLabel="Fewer hours"
        increaseMinutesLabel="More minutes"
        decreaseMinutesLabel="Fewer minutes"
        minuteStep={minuteStep}
        maxMinutes={maxMinutes}
        value={value}
        onChangeAction={setValue}
        describedBy="hint"
      />
      <span id="hint">15-minute steps</span>
      <output data-testid="value">{value}</output>
      <button onClick={() => setValue("2:45")}>Use available hours</button>
    </>
  );
}
const hours = () => screen.getByRole("spinbutton", { name: "Hours" });
const minutes = () => screen.getByRole("spinbutton", { name: "Minutes" });
const duration = () => screen.getByTestId("value");
describe("DurationInput", () => {
  it("shows accessible values and units without an editable field", () => {
    const { container } = render(<Example initial="1:00" />);
    expect(container.querySelector("input, textarea, select")).toBeNull();
    expect(hours()).toHaveAttribute("aria-valuenow", "1");
    expect(minutes()).toHaveAttribute("aria-valuemax", "45");
    expect(minutes()).toHaveTextContent("00");
    expect(minutes()).toHaveAccessibleDescription("15-minute steps");
    expect(screen.getByText(":")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Fewer minutes" }),
    ).toBeDisabled();
  });
  it("steps hours and quarter hours independently using buttons", () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "More hours" }));
    fireEvent.click(screen.getByRole("button", { name: "More minutes" }));
    expect(duration()).toHaveTextContent("1:15");
    fireEvent.click(screen.getByRole("button", { name: "Fewer hours" }));
    expect(duration()).toHaveTextContent("0:15");
  });
  it("bounds keyboard changes and supports PageUp, PageDown, Home and End", () => {
    render(<Example />);
    fireEvent.keyDown(minutes(), { key: "PageUp" });
    expect(duration()).toHaveTextContent("0:45");
    expect(screen.getByRole("button", { name: "More minutes" })).toBeDisabled();
    fireEvent.keyDown(minutes(), { key: "ArrowDown" });
    expect(duration()).toHaveTextContent("0:30");
    fireEvent.keyDown(minutes(), { key: "Home" });
    fireEvent.keyDown(hours(), { key: "End" });
    expect(duration()).toHaveTextContent("10:00");
    fireEvent.keyDown(hours(), { key: "PageDown" });
    expect(duration()).toHaveTextContent("5:00");
    fireEvent.keyDown(minutes(), { key: "3" });
    expect(duration()).toHaveTextContent("5:00");
  });
  it("respects the total duration cap in both selectors", () => {
    render(<Example initial="1:15" maxMinutes={90} />);
    fireEvent.keyDown(minutes(), { key: "End" });
    expect(duration()).toHaveTextContent("1:30");
    expect(hours()).toHaveAttribute("aria-valuemax", "1");
    expect(screen.getByRole("button", { name: "More hours" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "More minutes" })).toBeDisabled();
  });
  it("supports configurable minute steps and external updates", () => {
    render(<Example minuteStep={30} />);
    fireEvent.keyDown(minutes(), { key: "ArrowUp" });
    expect(duration()).toHaveTextContent("0:30");
    fireEvent.click(
      screen.getByRole("button", { name: "Use available hours" }),
    );
    expect(hours()).toHaveAttribute("aria-valuenow", "2");
    expect(minutes()).toHaveAttribute("aria-valuenow", "45");
  });
  it("accumulates desktop wheel movement and prevents page scrolling over the value", () => {
    render(<Example initial="1:00" />);
    expect(fireEvent.wheel(minutes(), { deltaY: -20 })).toBe(false);
    expect(duration()).toHaveTextContent("1:00");
    fireEvent.wheel(minutes(), { deltaY: -20 });
    expect(duration()).toHaveTextContent("1:15");
    fireEvent.wheel(hours(), { deltaY: 100 });
    expect(duration()).toHaveTextContent("0:15");
  });
  it("leaves zoom, horizontal scrolling and coarse-pointer wheels untouched", () => {
    render(<Example initial="1:00" />);
    expect(fireEvent.wheel(minutes(), { deltaY: -100, ctrlKey: true })).toBe(
      true,
    );
    expect(fireEvent.wheel(minutes(), { deltaY: -100, deltaX: 200 })).toBe(
      true,
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );
    expect(fireEvent.wheel(minutes(), { deltaY: -100 })).toBe(true);
    expect(duration()).toHaveTextContent("1:00");
  });
  it("increases on upward touch swipes and decreases on downward swipes", () => {
    render(<Example initial="1:00" />);
    fireEvent.pointerDown(minutes(), { clientX: 50, clientY: 100 });
    fireEvent.pointerMove(minutes(), { clientX: 50, clientY: 52 });
    expect(duration()).toHaveTextContent("1:30");
    fireEvent.pointerMove(minutes(), { clientX: 50, clientY: 76 });
    expect(duration()).toHaveTextContent("1:15");
    fireEvent.pointerUp(minutes());
    fireEvent.pointerMove(minutes(), { clientX: 50, clientY: 28 });
    expect(duration()).toHaveTextContent("1:15");
  });
  it("ignores horizontal swipes, mouse dragging and cancelled gestures", () => {
    render(<Example initial="1:00" />);
    fireEvent.pointerDown(minutes(), {
      clientX: 50,
      clientY: 100,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(minutes(), {
      clientX: 50,
      clientY: 0,
      pointerType: "mouse",
    });
    fireEvent.pointerDown(minutes(), { clientX: 50, clientY: 100 });
    fireEvent.pointerMove(minutes(), { clientX: 150, clientY: 76 });
    fireEvent.pointerCancel(minutes());
    fireEvent.pointerMove(minutes(), { clientX: 50, clientY: 0 });
    expect(duration()).toHaveTextContent("1:00");
  });
});
