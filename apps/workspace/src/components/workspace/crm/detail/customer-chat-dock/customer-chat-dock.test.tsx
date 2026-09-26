// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CustomerChatDock } from "./customer-chat-dock";

const content = getCrmCockpitDictionary("de");

describe("CustomerChatDock", () => {
  afterEach(cleanup);

  it("starts collapsed and opens as a clearly marked mock without working controls", () => {
    render(
      <CustomerChatDock
        badgeLabel={content.mock.badge}
        content={content.chat}
      />,
    );

    const toggle = screen.getByRole("button", { name: content.chat.expand });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("textbox")).toBeNull();

    fireEvent.click(toggle);

    expect(
      screen.getByRole("button", { name: content.chat.collapse }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("heading", { name: content.chat.title }),
    ).toBeVisible();
    expect(screen.getByText(content.mock.badge)).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: content.chat.inputLabel }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: content.chat.send }),
    ).toBeDisabled();
  });

  it("never shows an unread count while there are no real reads", () => {
    const { container } = render(
      <CustomerChatDock
        badgeLabel={content.mock.badge}
        content={content.chat}
      />,
    );
    expect(container.textContent).not.toMatch(/\d/);
  });
});
