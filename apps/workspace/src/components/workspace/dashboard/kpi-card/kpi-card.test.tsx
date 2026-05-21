// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { KpiCard } from "./kpi-card";

afterEach(() => {
  cleanup();
});

describe("KpiCard", () => {
  it("renders title and value", () => {
    render(<KpiCard title="Akquise-Volumen" value="42" />);

    expect(
      screen.getByRole("heading", { name: "Akquise-Volumen" }),
    ).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders comparison block with formatted delta and description", () => {
    render(
      <KpiCard
        title="Akquise-Volumen"
        value="12"
        comparison={{
          trend: "up",
          formattedDelta: "+33%",
          description: "vs. Vorperiode (9)",
        }}
      />,
    );

    expect(screen.getByText("+33%")).toBeInTheDocument();
    expect(screen.getByText("vs. Vorperiode (9)")).toBeInTheDocument();
  });

  it("applies a trend modifier class for up/down/flat", () => {
    const { container, rerender } = render(
      <KpiCard
        title="Akquise-Volumen"
        value="12"
        comparison={{
          trend: "up",
          formattedDelta: "+33%",
          description: "vs. Vorperiode",
        }}
      />,
    );

    const findComparison = () =>
      container.querySelector("[data-trend]") as HTMLElement | null;

    expect(findComparison()?.dataset.trend).toBe("up");

    rerender(
      <KpiCard
        title="Akquise-Volumen"
        value="12"
        comparison={{
          trend: "down",
          formattedDelta: "−10%",
          description: "vs. Vorperiode",
        }}
      />,
    );
    expect(findComparison()?.dataset.trend).toBe("down");

    rerender(
      <KpiCard
        title="Akquise-Volumen"
        value="12"
        comparison={{
          trend: "flat",
          formattedDelta: "0%",
          description: "vs. Vorperiode",
        }}
      />,
    );
    expect(findComparison()?.dataset.trend).toBe("flat");
  });

  it("renders badge, subText, and sparkline slots when provided", () => {
    render(
      <KpiCard
        title="Akquise-Volumen"
        value="12"
        badge={<span data-testid="badge">3 warten</span>}
        subText={<span data-testid="sub">Letzte 30 Tage</span>}
        sparkline={<svg data-testid="spark" aria-hidden="true" />}
      />,
    );

    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByTestId("sub")).toBeInTheDocument();
    expect(screen.getByTestId("spark")).toBeInTheDocument();
  });

  it("does not render optional slots when omitted", () => {
    const { container } = render(<KpiCard title="Title" value="0" />);

    expect(container.querySelector("[data-trend]")).toBeNull();
    expect(container.querySelector('[data-slot="badge"]')).toBeNull();
    expect(container.querySelector('[data-slot="sub"]')).toBeNull();
    expect(container.querySelector('[data-slot="sparkline"]')).toBeNull();
  });
});
