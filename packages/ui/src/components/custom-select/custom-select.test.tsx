// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomSelect } from "@invessiv/ui";

const options = [
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "all", label: "All" },
] as const;

afterEach(cleanup);

describe("CustomSelect single-select keyboard interaction", () => {
  it("opens with ArrowDown, moves through options, and selects with Enter", () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        ariaLabel="Time range"
        id="time-range"
        onChange={onChange}
        options={options}
        value="today"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Time range" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: "Today" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("option", { name: "Today" }), {
      key: "ArrowDown",
    });
    expect(screen.getByRole("option", { name: "Last 7 days" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("option", { name: "Last 7 days" }), {
      key: "Enter",
    });
    expect(onChange).toHaveBeenCalledWith("week");
    expect(trigger).toHaveFocus();
  });

  it("opens on pointer click and selects an option on click", () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        ariaLabel="Time range"
        id="time-range"
        onChange={onChange}
        options={options}
        value="today"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Time range" });
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "All" }));
    expect(onChange).toHaveBeenCalledWith("all");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports Home, End, wrapping, and Escape", () => {
    render(
      <CustomSelect
        ariaLabel="Time range"
        id="time-range"
        onChange={() => undefined}
        options={options}
        value="today"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Time range" });
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    const lastOption = screen.getByRole("option", { name: "All" });
    expect(lastOption).toHaveFocus();

    fireEvent.keyDown(lastOption, { key: "Home" });
    const firstOption = screen.getByRole("option", { name: "Today" });
    expect(firstOption).toHaveFocus();

    fireEvent.keyDown(firstOption, { key: "ArrowUp" });
    expect(lastOption).toHaveFocus();

    fireEvent.keyDown(lastOption, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
