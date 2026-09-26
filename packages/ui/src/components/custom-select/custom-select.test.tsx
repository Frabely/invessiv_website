// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomSelectSize } from "@invessiv/common/constants/ui/custom-select-sizes";
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

  it("does not open when disabled", () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        ariaLabel="Time range"
        disabled
        id="time-range"
        onChange={onChange}
        options={options}
        value="today"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Time range" });
    expect(trigger).toBeDisabled();

    fireEvent.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("CustomSelect compact size", () => {
  it("keeps the selected label as tooltip and text while showing only the symbol", () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        ariaLabel="Status of Kickoff: Open"
        id="status"
        onChange={onChange}
        options={[
          { value: "open", label: "Open", leading: <span>○</span> },
          { value: "done", label: "Done", leading: <span>●</span> },
        ]}
        size={CustomSelectSize.Compact}
        value="open"
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Status of Kickoff: Open",
    });
    expect(trigger).toHaveAttribute("data-size", CustomSelectSize.Compact);
    expect(trigger).toHaveAttribute("title", "Open");
    expect(trigger).toHaveTextContent("Open");

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("option", { name: /Done/ }));
    expect(onChange).toHaveBeenCalledWith("done");
  });
});
