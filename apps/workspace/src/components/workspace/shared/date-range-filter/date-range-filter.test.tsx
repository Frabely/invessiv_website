// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DateRangePreset } from "@/common/constants/date-range/date-range-presets";
import { DateRangeFilter } from "./date-range-filter";

const labels = {
  group: "Zeitraum",
  preset: "Zeitraum auswählen",
  from: "Von",
  to: "Bis",
  options: {
    today: "Heute",
    last7Days: "Letzte 7 Tage",
    last30Days: "Letzte 30 Tage",
    last90Days: "Letzte 90 Tage",
    all: "Alle",
    custom: "Benutzerdefiniert",
  },
};

function choosePreset(optionLabel: string) {
  fireEvent.click(screen.getByRole("button", { name: labels.preset }));
  fireEvent.click(screen.getByRole("option", { name: optionLabel }));
}

describe("DateRangeFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00Z"));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("defaults to the last 7 days and initially hides custom inputs", () => {
    render(
      <DateRangeFilter
        fromValue=""
        labels={labels}
        onRangeChangeAction={() => undefined}
        toValue=""
      />,
    );
    expect(
      screen.getByRole("button", { name: labels.preset }),
    ).toHaveTextContent(labels.options.last7Days);
    expect(screen.queryByLabelText(labels.from)).not.toBeInTheDocument();
  });

  it("honors an All default", () => {
    render(
      <DateRangeFilter
        defaultPreset={DateRangePreset.All}
        fromValue=""
        labels={labels}
        onRangeChangeAction={() => undefined}
        toValue=""
      />,
    );
    expect(
      screen.getByRole("button", { name: labels.preset }),
    ).toHaveTextContent(labels.options.all);
  });

  it.each([
    ["Heute", DateRangePreset.Today, "2026-05-21"],
    ["Letzte 7 Tage", DateRangePreset.Last7Days, "2026-05-15"],
    ["Letzte 30 Tage", DateRangePreset.Last30Days, "2026-04-22"],
    ["Letzte 90 Tage", DateRangePreset.Last90Days, "2026-02-21"],
  ])("calculates %s including today", (_, preset, expectedFrom) => {
    const onChange = vi.fn();
    render(
      <DateRangeFilter
        defaultPreset={DateRangePreset.All}
        fromValue=""
        labels={labels}
        onRangeChangeAction={onChange}
        toValue=""
      />,
    );
    choosePreset(String(_));
    expect(onChange).toHaveBeenLastCalledWith({
      preset,
      from: expectedFrom,
      to: "2026-05-21",
    });
  });

  it("clears both bounds for All", () => {
    const onChange = vi.fn();
    render(
      <DateRangeFilter
        fromValue="2026-05-15"
        labels={labels}
        onRangeChangeAction={onChange}
        toValue="2026-05-21"
      />,
    );
    choosePreset(labels.options.all);
    expect(onChange).toHaveBeenLastCalledWith({
      preset: DateRangePreset.All,
      from: undefined,
      to: undefined,
    });
  });

  it("retains preset values for Custom and emits one atomic range", () => {
    const onChange = vi.fn();
    render(
      <DateRangeFilter
        fromValue="2026-05-15"
        labels={labels}
        onRangeChangeAction={onChange}
        toValue="2026-05-21"
      />,
    );
    choosePreset(labels.options.custom);
    expect(screen.getByLabelText(labels.from)).toHaveValue("2026-05-15");
    fireEvent.change(screen.getByLabelText(labels.from), {
      target: { value: "2026-05-20" },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      preset: DateRangePreset.Custom,
      from: "2026-05-20",
      to: "2026-05-21",
    });
    expect(screen.getByLabelText(labels.from)).toHaveAttribute(
      "max",
      "2026-05-21",
    );
    expect(screen.getByLabelText(labels.to)).toHaveAttribute(
      "min",
      "2026-05-20",
    );
  });
});
