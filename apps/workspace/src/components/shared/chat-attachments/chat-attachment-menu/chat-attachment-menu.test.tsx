// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatAttachmentMenu } from "./chat-attachment-menu";

const labels = {
  attach: "Attach a file",
  upload: "Upload a new file",
  pick: "Choose an existing file",
  limitReached: "Up to 10 attachments per message.",
};

function renderMenu(
  props: Partial<Parameters<typeof ChatAttachmentMenu>[0]> = {},
) {
  const actions = { onPickAction: vi.fn(), onUploadAction: vi.fn() };
  render(
    <ChatAttachmentMenu
      canPick
      canUpload
      labels={labels}
      limitReached={false}
      {...actions}
      {...props}
    />,
  );
  return actions;
}

describe("ChatAttachmentMenu", () => {
  afterEach(cleanup);

  it("opens both choices and closes on Escape with focus back on the trigger", () => {
    const actions = renderMenu();
    const trigger = screen.getByRole("button", { name: labels.attach });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: labels.pick })).toBeNull();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: labels.pick }));
    expect(actions.onPickAction).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: labels.upload })).toBeNull();
  });

  it("runs the only allowed action directly", () => {
    const actions = renderMenu({ canPick: false });
    fireEvent.click(screen.getByRole("button", { name: labels.attach }));
    expect(actions.onUploadAction).toHaveBeenCalledOnce();
  });

  it("is disabled at the attachment limit and absent without any right", () => {
    renderMenu({ limitReached: true });
    expect(screen.getByRole("button", { name: labels.attach })).toBeDisabled();
    cleanup();

    renderMenu({ canPick: false, canUpload: false });
    expect(screen.queryByRole("button", { name: labels.attach })).toBeNull();
  });
});
