// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProcessStepVariant } from "@invessiv/common/constants/ui/process-step-variants";
import { ProcessTrack } from "@invessiv/ui";

describe("ProcessTrack", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(cleanup);

  it("marks the current step and allows editing only when an action is supplied", () => {
    const { rerender } = render(
      <ProcessTrack
        currentIndex={1}
        label="Phases"
        steps={["Start", "Build", "Launch"]}
      />,
    );
    expect(
      screen.getAllByRole("listitem").map((item) => item.dataset.state),
    ).toEqual(["complete", "current", "upcoming"]);
    expect(screen.getAllByRole("listitem")[1]).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.queryByRole("button")).toBeNull();

    const onStepAction = vi.fn();
    rerender(
      <ProcessTrack
        currentIndex={1}
        label="Phases"
        onStepAction={onStepAction}
        steps={["Start", "Build", "Launch"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Launch" }));
    expect(onStepAction).toHaveBeenCalledWith("Launch", 2);
  });
});

describe("ProcessTrack step objects", () => {
  afterEach(cleanup);

  it("renders labels and exposes the accent variant as a data attribute", () => {
    const onStepAction = vi.fn();
    render(
      <ProcessTrack
        currentIndex={0}
        label="Phases"
        onStepAction={onStepAction}
        scrollCurrentIntoView={false}
        steps={[
          { key: "start", label: "Start" },
          {
            key: "round-1",
            label: "Round 1",
            variant: ProcessStepVariant.Accent,
          },
          {
            key: "round-2",
            label: "Round 1",
            variant: ProcessStepVariant.Accent,
          },
        ]}
      />,
    );

    expect(
      screen.getAllByRole("listitem").map((item) => item.dataset.variant),
    ).toEqual(["default", "accent", "accent"]);
    fireEvent.click(screen.getAllByRole("button", { name: "Round 1" })[1]!);
    expect(onStepAction).toHaveBeenCalledWith("Round 1", 2);
  });
});
