// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import { Widget } from "./widget";

describe("Widget", () => {
  afterEach(cleanup);

  it("renders a labelled section without an open trigger in none mode", () => {
    render(
      <Widget openMode={WidgetOpenMode.None} title="Contact" count={2}>
        <p>Body</p>
      </Widget>,
    );

    const section = screen.getByRole("region", { name: "Contact 2" });
    expect(section).toHaveAttribute("data-open-mode", "none");
    expect(section).not.toHaveAttribute("data-mock");
    expect(
      screen.getByRole("heading", { level: 2, name: "Contact 2" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("honours the requested heading level", () => {
    render(
      <Widget headingLevel={3} openMode={WidgetOpenMode.None} title="Files">
        <p>Body</p>
      </Widget>,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Files" }),
    ).toBeInTheDocument();
  });

  it("marks mock widgets with a visible badge and data-mock", () => {
    render(
      <Widget
        mock={{ badgeLabel: "Coming soon" }}
        openMode={WidgetOpenMode.None}
        title="Hours"
      >
        <p>Illustration</p>
      </Widget>,
    );

    expect(screen.getByText("Coming soon")).toBeVisible();
    expect(screen.getByRole("region", { name: "Hours" })).toHaveAttribute(
      "data-mock",
      "true",
    );
  });

  it("opens a dialog through a native button announcing the popup", () => {
    const onOpenAction = vi.fn();
    render(
      <Widget
        onOpenAction={onOpenAction}
        openLabel="View all"
        openMode={WidgetOpenMode.Dialog}
        title="Tasks"
      >
        <p>Body</p>
      </Widget>,
    );

    const trigger = screen.getByRole("button", { name: "View all" });
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("type", "button");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).not.toHaveAttribute("aria-expanded");

    trigger.focus();
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    expect(onOpenAction).toHaveBeenCalledTimes(1);
  });

  it("only stretches the trigger over the card when requested", () => {
    const { rerender } = render(
      <Widget
        onOpenAction={() => undefined}
        openLabel="Open"
        openMode={WidgetOpenMode.Dialog}
        title="Feedback"
      >
        <p>Body</p>
      </Widget>,
    );
    const section = screen.getByRole("region", { name: "Feedback" });
    expect(section).not.toHaveAttribute("data-whole-card");

    rerender(
      <Widget
        onOpenAction={() => undefined}
        openLabel="Open"
        openMode={WidgetOpenMode.Dialog}
        title="Feedback"
        wholeCardClickable
      >
        <p>Body</p>
      </Widget>,
    );
    expect(section).toHaveAttribute("data-whole-card", "true");
  });

  it("wires the dock trigger to the dock panel", () => {
    const onOpenAction = vi.fn();
    render(
      <Widget
        controlsId="chat-dock-panel"
        expanded={false}
        onOpenAction={onOpenAction}
        openLabel="Open messages"
        openMode={WidgetOpenMode.Dock}
        title="Messages"
      >
        <p>Body</p>
      </Widget>,
    );

    const trigger = screen.getByRole("button", { name: "Open messages" });
    expect(trigger).toHaveAttribute("aria-controls", "chat-dock-panel");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveAttribute("aria-haspopup");
    fireEvent.click(trigger);
    expect(onOpenAction).toHaveBeenCalledTimes(1);
  });

  it("toggles the expanded region and data-expanded when uncontrolled", () => {
    const onExpandedChangeAction = vi.fn();
    render(
      <Widget
        closeLabel="Show less"
        expandedContent={<p>Full list</p>}
        onExpandedChangeAction={onExpandedChangeAction}
        openLabel="Show more"
        openMode={WidgetOpenMode.Expand}
        title="Our tasks"
      >
        <p>Summary</p>
      </Widget>,
    );

    const section = screen.getByRole("region", { name: "Our tasks" });
    const trigger = screen.getByRole("button", { name: "Show more" });
    const region = document.getElementById(
      trigger.getAttribute("aria-controls") ?? "",
    );
    expect(section).toHaveAttribute("data-expanded", "false");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(region).not.toBeVisible();

    fireEvent.click(trigger);
    expect(section).toHaveAttribute("data-expanded", "true");
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Full list")).toBeVisible();
    expect(onExpandedChangeAction).toHaveBeenCalledWith(true);
  });

  it("leaves the expanded state to the consumer when controlled", () => {
    const onExpandedChangeAction = vi.fn();
    render(
      <Widget
        closeLabel="Show less"
        expanded={false}
        expandedContent={<p>Full list</p>}
        onExpandedChangeAction={onExpandedChangeAction}
        openLabel="Show more"
        openMode={WidgetOpenMode.Expand}
        title="Completed projects"
      >
        <p>Summary</p>
      </Widget>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(onExpandedChangeAction).toHaveBeenCalledWith(true);
    expect(
      screen.getByRole("region", { name: "Completed projects" }),
    ).toHaveAttribute("data-expanded", "false");
  });
});
