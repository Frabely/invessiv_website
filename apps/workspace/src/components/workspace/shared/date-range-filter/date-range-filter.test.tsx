// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DateRangeFilter } from "./date-range-filter";

const labels = {
  group: "Zeitraum",
  from: "Von",
  to: "Bis",
};

describe("DateRangeFilter", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the group label and both inputs with current values", () => {
    render(
      <DateRangeFilter
        fromValue="2026-01-01"
        labels={labels}
        onFromChangeAction={() => undefined}
        onToChangeAction={() => undefined}
        toValue="2026-01-31"
      />,
    );

    expect(screen.getByText("Zeitraum")).toBeInTheDocument();
    expect(screen.getByLabelText("Von")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("Bis")).toHaveValue("2026-01-31");
  });

  it("calls onFromChange and onToChange with the new value", () => {
    const handleFromChange = vi.fn();
    const handleToChange = vi.fn();

    render(
      <DateRangeFilter
        fromValue=""
        labels={labels}
        onFromChangeAction={handleFromChange}
        onToChangeAction={handleToChange}
        toValue=""
      />,
    );

    fireEvent.change(screen.getByLabelText("Von"), {
      target: { value: "2026-02-01" },
    });
    expect(handleFromChange).toHaveBeenCalledWith("2026-02-01");

    fireEvent.change(screen.getByLabelText("Bis"), {
      target: { value: "2026-02-28" },
    });
    expect(handleToChange).toHaveBeenCalledWith("2026-02-28");
  });

  it("passes undefined to handlers when the input is cleared", () => {
    const handleFromChange = vi.fn();

    render(
      <DateRangeFilter
        fromValue="2026-02-01"
        labels={labels}
        onFromChangeAction={handleFromChange}
        onToChangeAction={() => undefined}
        toValue=""
      />,
    );

    fireEvent.change(screen.getByLabelText("Von"), { target: { value: "" } });
    expect(handleFromChange).toHaveBeenCalledWith(undefined);
  });

  it("sets max on the from input and min on the to input to prevent inverted ranges", () => {
    render(
      <DateRangeFilter
        fromValue="2026-01-01"
        labels={labels}
        onFromChangeAction={() => undefined}
        onToChangeAction={() => undefined}
        toValue="2026-01-31"
      />,
    );

    expect(screen.getByLabelText("Von")).toHaveAttribute("max", "2026-01-31");
    expect(screen.getByLabelText("Bis")).toHaveAttribute("min", "2026-01-01");
  });
});
