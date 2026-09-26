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
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <ChatDock
        content={content}
        expanded={false}
        onExpandedChange={onExpandedChange}
      >
        <p>Real thread</p>
      </ChatDock>,
    );
    fireEvent.click(screen.getByRole("button", { name: content.expand }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getByText("Real thread")).not.toBeVisible();

    rerender(
      <ChatDock content={content} expanded onExpandedChange={onExpandedChange}>
        <p>Real thread</p>
      </ChatDock>,
    );
    expect(screen.getByText("Real thread")).toBeVisible();
    expect(screen.queryByText(content.body)).toBeNull();
  });
});
