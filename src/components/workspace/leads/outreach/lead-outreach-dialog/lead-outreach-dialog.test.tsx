// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import type { LeadsOutreachDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadOutreachDialog } from "./lead-outreach-dialog";

const { checkOutreachProvidersMock, generateOutreachMessageMock } = vi.hoisted(
  () => ({
    checkOutreachProvidersMock: vi.fn(),
    generateOutreachMessageMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock(
  "@/client/leads/outreach/lead-outreach-provider-status-service",
  () => ({
    outreachProviderStatusService: {
      checkOutreachProviders: checkOutreachProvidersMock,
    },
  }),
);

vi.mock("@/client/leads/outreach/lead-outreach-generation-service", () => ({
  outreachGenerationClientService: {
    generateOutreachMessage: generateOutreachMessageMock,
  },
}));

vi.mock("@/client/leads/outreach/lead-outreach-clipboard-service", () => ({
  copyTextToClipboard: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  checkOutreachProvidersMock.mockResolvedValue({
    openai: true,
    openaiModel: "gpt-4.1-mini",
  });

  generateOutreachMessageMock.mockResolvedValue({
    ok: true,
    channel: OutreachChannel.Linkedin,
    body: "OpenAI Entwurf",
  });
});

const content: LeadsOutreachDictionary = {
  triggerLabel: "Draft outreach",
  dialog: {
    eyebrow: "AI draft",
    title: "Draft outreach",
    description: "Create a short message.",
    closeAriaLabel: "Close dialog",
  },
  channel: {
    label: "Channel",
    labels: {
      linkedin: "LinkedIn",
      email: "Email",
      instagram: "Instagram",
      "direct-message": "Direct message",
    },
    hints: {
      linkedin: "Professional and calm.",
      email: "Email copy.",
      instagram: "Casual.",
      "direct-message": "Private contact.",
    },
  },
  contextNote: {
    label: "Additional context",
    placeholder: "Optional",
    counterLabel: "{count}/{max} characters",
  },
  result: {
    subjectLabel: "Subject",
    bodyLabel: "Message",
    subjectPlaceholder: "Subject",
    bodyPlaceholder: "Body",
    emptyState: "No draft yet.",
  },
  status: {
    generating: "Generating...",
    copied: "Copied",
    ready: "Ready",
    checkingProviders: "Checking providers...",
    openAiActive: "OpenAI active",
    noProvider: "No provider available",
  },
  buttons: {
    generate: "Generate",
    regenerate: "Regenerate",
    copy: "Copy",
    copied: "Copied",
    cancel: "Cancel",
    close: "Close",
  },
  errors: {
    validation: "Invalid request.",
    leadNotFound: "Lead not found.",
    providerUnavailable: "Provider unavailable.",
    notConfigured: "Not configured.",
    internal: "Internal error.",
  },
};

describe("LeadOutreachDialog", () => {
  it("shows the OpenAI provider badge when OpenAI is configured", async () => {
    checkOutreachProvidersMock.mockResolvedValueOnce({
      openai: true,
      openaiModel: "gpt-4.1-mini",
    });

    render(
      <LeadOutreachDialog
        content={content}
        leadDisplayName="Muster Lead"
        leadId="lead-1"
        onCloseAction={vi.fn()}
        refreshToken={0}
      />,
    );

    const badge = await screen.findByText(/OpenAI active · gpt-4\.1-mini/i);
    expect(badge.getAttribute("data-state")).toBe("openai");

    await waitFor(() => {
      const generateButton = screen.getByRole("button", {
        name: content.buttons.generate,
      });
      expect(generateButton.hasAttribute("disabled")).toBe(false);
    });
  });

  it("keeps generation enabled when the provider check reports no provider", async () => {
    checkOutreachProvidersMock.mockResolvedValueOnce({
      openai: false,
      openaiModel: null,
    });

    render(
      <LeadOutreachDialog
        content={content}
        leadDisplayName="Muster Lead"
        leadId="lead-1"
        onCloseAction={vi.fn()}
        refreshToken={0}
      />,
    );

    await screen.findByText(/No provider available/i);

    expect(
      screen
        .getByRole("button", { name: content.buttons.generate })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("sends only the structured request fields to the server", async () => {
    render(
      <LeadOutreachDialog
        content={content}
        leadDisplayName="Muster Lead"
        leadId="lead-1"
        onCloseAction={vi.fn()}
        refreshToken={0}
      />,
    );

    await screen.findByText(/OpenAI active · gpt-4\.1-mini/i);
    fireEvent.click(
      screen.getByRole("button", {
        name: content.buttons.generate,
      }),
    );

    await waitFor(() => {
      expect(generateOutreachMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: OutreachChannel.Linkedin,
          leadId: "lead-1",
        }),
      );
    });
  });

  it("uses the generated subject and body on email drafts", async () => {
    generateOutreachMessageMock.mockResolvedValueOnce({
      ok: true,
      channel: OutreachChannel.Email,
      subject: "Kurzer LinkedIn-Betreff",
      body: "Hallo Peter,\n\nKurzer Text.",
    });

    render(
      <LeadOutreachDialog
        content={content}
        leadDisplayName="Muster Lead"
        leadId="lead-1"
        onCloseAction={vi.fn()}
        refreshToken={0}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: content.buttons.generate,
      }),
    );

    expect(
      await screen.findByDisplayValue("Kurzer LinkedIn-Betreff"),
    ).toBeTruthy();
    expect(screen.getByLabelText(content.result.subjectLabel)).toBeTruthy();
    expect(screen.getByLabelText(content.result.bodyLabel)).toBeTruthy();
  });

  it("renders a subject field when the server returns one for a non-subject channel", async () => {
    generateOutreachMessageMock.mockResolvedValueOnce({
      ok: true,
      channel: OutreachChannel.Instagram,
      subject: "Optionaler Betreff",
      body: "Kurz und locker.",
    });

    render(
      <LeadOutreachDialog
        content={content}
        leadDisplayName="Muster Lead"
        leadId="lead-1"
        onCloseAction={vi.fn()}
        refreshToken={0}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: content.buttons.generate,
      }),
    );

    expect(await screen.findByDisplayValue("Optionaler Betreff")).toBeTruthy();
    expect(screen.getByDisplayValue("Kurz und locker.")).toBeTruthy();
  });

  it("keeps whitespace in the context note input until submit", async () => {
    render(
      <LeadOutreachDialog
        content={content}
        leadDisplayName="Muster Lead"
        leadId="lead-1"
        onCloseAction={vi.fn()}
        refreshToken={0}
      />,
    );

    const contextInput = screen.getByLabelText(/Additional context/i);
    await waitFor(() => {
      expect(document.activeElement).toBe(contextInput);
    });
    fireEvent.change(contextInput, { target: { value: "  in English  " } });
    expect((contextInput as HTMLTextAreaElement).value).toBe("  in English  ");

    fireEvent.click(
      screen.getByRole("button", {
        name: content.buttons.generate,
      }),
    );

    await waitFor(() => {
      expect(generateOutreachMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contextNote: "  in English  ",
        }),
      );
    });
  });
});
