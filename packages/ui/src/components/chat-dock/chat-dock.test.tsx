// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatDock } from "./chat-dock";

const content = {
  title: "Messages",
  expand: "Open messages",
  collapse: "Close messages",
  readAlong: "Shared conversation",
  body: "Coming soon",
  inputLabel: "Message",
  inputPlaceholder: "Write a message",
  send: "Send",
};

describe("ChatDock", () => {
  afterEach(cleanup);

  it("allows external control and renders a supplied thread", () => {
    const onExpandedChangeAction = vi.fn();
    const { rerender } = render(
      <ChatDock
        content={content}
        expanded={false}
        onExpandedChangeAction={onExpandedChangeAction}
      >
        <p>Real thread</p>
      </ChatDock>,
    );
    fireEvent.click(screen.getByRole("button", { name: content.expand }));
    expect(
      screen.getByRole("button", { name: content.expand }).textContent,
    ).toBe("");
    expect(onExpandedChangeAction).toHaveBeenCalledWith(true);
    expect(screen.getByText("Real thread")).not.toBeVisible();

    rerender(
      <ChatDock
        content={content}
        expanded
        onExpandedChangeAction={onExpandedChangeAction}
      >
        <p>Real thread</p>
      </ChatDock>,
    );
    expect(screen.getByText("Real thread")).toBeVisible();
    expect(screen.queryByText(content.body)).toBeNull();
  });
});
