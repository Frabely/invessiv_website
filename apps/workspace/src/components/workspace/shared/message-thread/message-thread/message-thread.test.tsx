// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { PendingMessageStatus } from "@/common/constants/ui/pending-message-statuses";
import type { MessageThreadLabels } from "@/common/contracts/ui/message-thread-labels";
import { MessageThread, type MessageThreadProps } from "./message-thread";

const labels: MessageThreadLabels = {
  logLabel: "Conversation",
  emptyTitle: "No messages yet",
  emptyBody: "The customer reads along.",
  loadOlder: "Load older messages",
  loadingOlder: "Loading…",
  newMessages: "New messages",
  today: "Today",
  yesterday: "Yesterday",
  own: "You",
  redacted: "Message hidden by the owner",
  systemFallback: "Event",
  sending: "Sending…",
  failed: "Not sent",
  retry: "Send again",
  redact: "Hide",
  inputLabel: "Message",
  inputPlaceholder: "Write a message",
  inputHint: "Enter sends, Shift+Enter adds a line",
  send: "Send",
  characterCount: "{count} of {max}",
};

let sequence = 0;

function message(overrides: Partial<MessageDto> = {}): MessageDto {
  sequence += 1;
  return {
    id: `m${sequence}`,
    conversationId: "conversation",
    type: MessageType.Text,
    body: `Body ${sequence}`,
    metadata: null,
    senderSide: MessageSenderSide.Customer,
    senderDisplayName: "Anna Berger",
    isOwn: false,
    createdAt: new Date().toISOString(),
    redactedAt: null,
    ...overrides,
  };
}

function renderThread(overrides: Partial<MessageThreadProps> = {}) {
  const props: MessageThreadProps = {
    draftScopeId: `customer-${sequence}`,
    describeSystemMessageAction: (entry) => `System: ${entry.body}`,
    hasOlder: false,
    labels,
    loadingOlder: false,
    locale: "en",
    messages: [],
    onLoadOlderAction: vi.fn(),
    onRetryAction: vi.fn(),
    onSendAction: vi.fn(),
    ownDisplayName: "Moritz",
    pending: [],
    ...overrides,
  };
  render(<MessageThread {...props} />);
  return props;
}

describe("MessageThread", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("explains the empty conversation", () => {
    renderThread();
    expect(screen.getByRole("log", { name: "Conversation" })).toBeVisible();
    expect(screen.getByText(labels.emptyTitle)).toBeVisible();
  });

  it("groups messages under one head and names the own side without colour", () => {
    renderThread({
      messages: [
        message(),
        message(),
        message({
          senderSide: MessageSenderSide.Internal,
          senderDisplayName: "Moritz",
          isOwn: true,
        }),
      ],
    });

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: /Anna Berger/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /You/ })).toBeInTheDocument();
    expect(screen.getByRole("separator")).toHaveTextContent("Today");
  });

  it("shows placeholders for redacted content and system events", () => {
    renderThread({
      messages: [
        message({ body: null, redactedAt: new Date().toISOString() }),
        message({
          type: MessageType.System,
          senderSide: MessageSenderSide.System,
          senderDisplayName: "System",
          body: "projectPhaseChanged",
        }),
      ],
    });

    expect(screen.getByText(labels.redacted)).toBeVisible();
    expect(screen.getByText("System: projectPhaseChanged")).toBeVisible();
  });

  it("renders markup as plain text and links only http addresses", () => {
    const { container } = render(
      <MessageThread
        describeSystemMessageAction={() => ""}
        draftScopeId="xss"
        hasOlder={false}
        labels={labels}
        loadingOlder={false}
        locale="en"
        messages={[
          message({
            body: '<img src=x onerror="alert(1)"> see https://example.test',
          }),
        ]}
        onLoadOlderAction={vi.fn()}
        onRetryAction={vi.fn()}
        ownDisplayName="Moritz"
        pending={[]}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(
      screen.getByText('<img src=x onerror="alert(1)"> see', { exact: false }),
    ).toBeVisible();
    const link = screen.getByRole("link", { name: "https://example.test" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("offers older messages and retrying a failed send", () => {
    const props = renderThread({
      hasOlder: true,
      pending: [
        {
          clientId: "p1",
          body: "Draft text",
          createdAt: new Date().toISOString(),
          status: PendingMessageStatus.Failed,
        },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: labels.loadOlder }));
    expect(props.onLoadOlderAction).toHaveBeenCalledOnce();
    expect(screen.getByText("Draft text")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(labels.failed);
    fireEvent.click(screen.getByRole("button", { name: labels.retry }));
    expect(props.onRetryAction).toHaveBeenCalledWith("p1");
  });

  it("offers hiding only when the consumer allows it", () => {
    const onRedactAction = vi.fn();
    const first = message();
    renderThread({ messages: [first], onRedactAction });
    fireEvent.click(screen.getByRole("button", { name: labels.redact }));
    expect(onRedactAction).toHaveBeenCalledWith(first.id);
    cleanup();

    renderThread({ messages: [message()] });
    expect(screen.queryByRole("button", { name: labels.redact })).toBeNull();
  });

  it("is read-only without a send handler", () => {
    renderThread({ onSendAction: undefined });
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});

describe("MessageComposer inside the thread", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("sends on Enter, keeps Shift+Enter as a line break and clears the draft", () => {
    const props = renderThread({ draftScopeId: "enter" });
    const input = screen.getByRole("textbox", { name: labels.inputLabel });

    fireEvent.change(input, { target: { value: "  Hello  " } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(props.onSendAction).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(props.onSendAction).toHaveBeenCalledWith("Hello");
    expect(input).toHaveValue("");
    expect(
      window.localStorage.getItem("invessiv:workspace:message-draft:enter"),
    ).toBeNull();
  });

  it("keeps the draft in storage and restores it", () => {
    renderThread({ draftScopeId: "restore" });
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Half written" },
    });
    expect(
      window.localStorage.getItem("invessiv:workspace:message-draft:restore"),
    ).toBe("Half written");
    cleanup();

    renderThread({ draftScopeId: "restore" });
    expect(screen.getByRole("textbox")).toHaveValue("Half written");
  });

  it("keeps working when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderThread({ draftScopeId: "blocked" });
    const input = screen.getByRole("textbox");

    expect(() =>
      fireEvent.change(input, { target: { value: "Still typing" } }),
    ).not.toThrow();
    expect(input).toHaveValue("Still typing");
  });

  it("shows the character counter near the limit", () => {
    renderThread({ draftScopeId: "counter" });
    const form = screen.getByRole("textbox").closest("form") as HTMLElement;
    expect(within(form).queryByText(/of 10000/)).toBeNull();

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "x".repeat(8000) },
    });
    expect(within(form).getByText("8000 of 10000")).toBeVisible();
  });
});
