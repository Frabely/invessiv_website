// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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
