// @vitest-environment jsdom
import "@/test/portal/dashboard/portal-dashboard-mocks";
import "@testing-library/jest-dom/vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import {
  setupPortalDashboardTests,
  portalDashboardTestContext,
} from "@/test/portal/dashboard/portal-dashboard-test-support";
const {
  mocks,
  content,
  messagesContent,
  CONVERSATION,
  FULL_READ,
  dto,
  renderDashboard,
} = portalDashboardTestContext();
setupPortalDashboardTests();
describe("PortalDashboard chat", () => {
  it("shows unread messages on the dock rail and marks them read when opened", async () => {
    mocks.getConversation.mockResolvedValue({ ok: true, value: CONVERSATION });
    mocks.markRead.mockResolvedValue({ ok: true, value: true });
    renderDashboard();

    expect(screen.queryByRole("region", { name: "Messages" })).toBeNull();
    const trigger = screen.getByRole("button", {
      name: `${content.chat.expand} (2 unread)`,
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(mocks.markRead).not.toHaveBeenCalled();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("log", { name: messagesContent.thread.logLabel }),
    ).toBeVisible();
    await waitFor(() =>
      expect(mocks.markRead).toHaveBeenCalledWith("customer-1", "message-2"),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });
  it("marks only the newest visible incoming message when an own message is newer", async () => {
    const conversation: PortalConversationDto = {
      ...CONVERSATION,
      messages: [
        CONVERSATION.messages[0]!,
        {
          ...CONVERSATION.messages[1]!,
          senderSide: "customer",
          isOwn: true,
        },
      ],
    };
    mocks.getConversation.mockResolvedValue({ ok: true, value: conversation });
    mocks.markRead.mockResolvedValue({ ok: true, value: true });
    renderDashboard({
      dashboard: dto(),
      permissions: FULL_READ,
      cockpitHref: null,
      conversation: conversation,
    });

    fireEvent.click(
      screen.getByRole("button", { name: `${content.chat.expand} (2 unread)` }),
    );

    await waitFor(() =>
      expect(mocks.markRead).toHaveBeenCalledWith("customer-1", "message-1"),
    );
  });
  it("arrives with the dock open for ?chat=open and drops the request when it is closed", () => {
    mocks.getConversation.mockResolvedValue({ ok: true, value: CONVERSATION });
    mocks.markRead.mockResolvedValue({ ok: true, value: true });
    mocks.search.value = "project=project-1&chat=open";
    window.history.replaceState(
      null,
      "",
      "/en/portal/customer-1?project=project-1&chat=open",
    );
    const replaceState = vi.spyOn(window.history, "replaceState");
    renderDashboard();

    const trigger = screen.getByRole("button", {
      name: `${content.chat.collapse} (2 unread)`,
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("log", { name: messagesContent.thread.logLabel }),
    ).toBeVisible();

    fireEvent.click(trigger);
    // A history write without a server round trip; Next's router state is left to its wrapper.
    const [state, , url] = replaceState.mock.calls.at(-1) ?? [];
    expect(state).not.toHaveProperty("__NA");
    expect(new URL(String(url)).pathname + new URL(String(url)).search).toBe(
      "/en/portal/customer-1?project=project-1",
    );
    expect(mocks.replace).not.toHaveBeenCalled();
    replaceState.mockRestore();
    window.history.replaceState(null, "", "/");
  });
  it("ignores ?chat=open without message read permission", () => {
    mocks.search.value = "chat=open";
    renderDashboard({
      dashboard: dto(),
      permissions: FULL_READ,
      cockpitHref: null,
      conversation: null,
    });

    expect(
      screen.queryByRole("log", { name: messagesContent.thread.logLabel }),
    ).toBeNull();
  });
  it("renders no chat dock without message read permission", () => {
    renderDashboard({
      dashboard: dto(),
      permissions: FULL_READ,
      cockpitHref: null,
      conversation: null,
    });

    expect(
      screen.queryByRole("button", { name: content.chat.expand }),
    ).toBeNull();
  });
});
