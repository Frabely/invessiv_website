// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ProcessStepProgress } from "@invessiv/common/constants/ui/process-step-progress";
import { ProcessStepTone } from "@invessiv/common/constants/ui/process-step-tones";
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

describe("ProcessTrack step progress", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(cleanup);

  it("shows each step by its own progress instead of its position", () => {
    render(
      <ProcessTrack
        currentIndex={2}
        label="Steps"
        steps={[
          {
            key: "a",
            label: "Company",
            progress: ProcessStepProgress.Empty,
          },
          {
            key: "b",
            label: "Brand",
            progress: ProcessStepProgress.Complete,
          },
          {
            key: "c",
            label: "Content",
            progress: ProcessStepProgress.Partial,
          },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.dataset.progress)).toEqual([
      "empty",
      "complete",
      "partial",
    ]);
    // A skipped step before the current one is not ticked off.
    expect(items[0].querySelector("svg")).toBeNull();
    expect(items[1].querySelector("svg")).not.toBeNull();
    expect(items[2]).toHaveAttribute("aria-current", "step");
  });

  it("leaves steps without progress to the position-based states", () => {
    render(
      <ProcessTrack
        currentIndex={1}
        label="Phases"
        steps={["Start", "Build"]}
      />,
    );

    const [first] = screen.getAllByRole("listitem");
    expect(first.dataset.progress).toBeUndefined();
    expect(first.querySelector("svg")).not.toBeNull();
  });
});

describe("ProcessTrack scrolling", () => {
  const pageScroll = vi.fn();
  const trackScroll = vi.fn();

  beforeAll(() => {
    Element.prototype.scrollIntoView = pageScroll;
    Object.defineProperty(Element.prototype, "scrollLeft", {
      configurable: true,
      get: () => 0,
      set: trackScroll,
    });
  });
  afterEach(() => {
    cleanup();
    pageScroll.mockClear();
    trackScroll.mockClear();
  });

  it("never scrolls the page, only its own track", () => {
    render(
      <ProcessTrack currentIndex={1} label="Phases" steps={["A", "B", "C"]} />,
    );

    expect(pageScroll).not.toHaveBeenCalled();
    expect(trackScroll).toHaveBeenCalledTimes(1);
  });

  it("keeps its position when only the steps are rebuilt", () => {
    const { rerender } = render(
      <ProcessTrack currentIndex={1} label="Phases" steps={["A", "B", "C"]} />,
    );
    trackScroll.mockClear();

    rerender(
      <ProcessTrack currentIndex={1} label="Phases" steps={["A", "B", "C"]} />,
    );

    expect(trackScroll).not.toHaveBeenCalled();
    expect(pageScroll).not.toHaveBeenCalled();
  });

  it("follows the current step when it changes", () => {
    const { rerender } = render(
      <ProcessTrack currentIndex={0} label="Phases" steps={["A", "B", "C"]} />,
    );
    trackScroll.mockClear();

    rerender(
      <ProcessTrack currentIndex={2} label="Phases" steps={["A", "B", "C"]} />,
    );

    expect(trackScroll).toHaveBeenCalledTimes(1);
  });
});

describe("ProcessTrack measured steps", () => {
  afterEach(cleanup);

  it("fills a step by its ratio and ticks it off only when it is valid", () => {
    render(
      <ProcessTrack
        currentIndex={1}
        label="Steps"
        scrollCurrentIntoView={false}
        steps={[
          {
            key: "a",
            label: "Company",
            ratio: 0.3,
            tone: ProcessStepTone.Info,
            detail: "3/10",
            statusLabel: "in progress",
            valid: true,
          },
          { key: "b", label: "Brand", ratio: 0 },
          {
            key: "c",
            label: "Content",
            ratio: 0.5,
            tone: ProcessStepTone.Danger,
            valid: true,
          },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.dataset.tone)).toEqual([
      "info",
      "neutral",
      "danger",
    ]);
    expect(items[0].querySelector("rect")).toHaveAttribute("width", "30");
    expect(items[0].querySelector('[data-icon="check"]')).not.toBeNull();
    expect(items[0]).toHaveTextContent("3/10");
    expect(items[0]).toHaveTextContent("in progress");
    expect(items[0]).toHaveTextContent("Company3/10, in progress");
    expect(items[1].querySelector('[data-icon="check"]')).toBeNull();
    // A step that needs attention never shows a tick, whatever else it reports.
    expect(items[2].querySelector('[data-icon="check"]')).toBeNull();
    expect(
      items[2].querySelector('[data-icon="circle-exclamation"]'),
    ).not.toBeNull();
  });

  it("flags a step next to its fill and tick without changing either", () => {
    render(
      <ProcessTrack
        currentIndex={1}
        label="Steps"
        steps={[
          {
            key: "a",
            label: "Company",
            ratio: 1,
            tone: ProcessStepTone.Success,
            valid: true,
            flagged: true,
          },
          { key: "b", label: "Goals", ratio: 0 },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("data-flagged", "true");
    expect(items[0].querySelector('[data-icon="comment-dots"]')).not.toBeNull();
    expect(items[0].querySelector('[data-icon="check"]')).not.toBeNull();
    expect(items[0].dataset.tone).toBe("success");
    expect(items[1]).not.toHaveAttribute("data-flagged");
    expect(items[1].querySelector('[data-icon="comment-dots"]')).toBeNull();
  });
});
