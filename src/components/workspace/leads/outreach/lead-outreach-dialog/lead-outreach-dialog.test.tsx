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
import { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { OutreachProvider } from "@/common/constants/workspace/leads/ai-outreach-generation/outreach-provider";
import type { LeadsOutreachDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadOutreachDialog } from "./lead-outreach-dialog";

const {
  checkOutreachProvidersMock,
  generateOutreachMessageMock,
  generateLocalOutreachMessageMock,
} = vi.hoisted(() => ({
  checkOutreachProvidersMock: vi.fn(),
  generateOutreachMessageMock: vi.fn(),
  generateLocalOutreachMessageMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock(
  "@/client/leads/outreach/lead-outreach-provider-status-service",
  () => ({
    checkOutreachProviders: checkOutreachProvidersMock,
  }),
);

vi.mock("@/client/leads/outreach/lead-outreach-generation-service", () => ({
  generateOutreachMessage: generateOutreachMessageMock,
}));

vi.mock(
  "@/client/leads/outreach/lead-outreach-local-generation-service",
  () => ({
    generateLocalOutreachMessage: generateLocalOutreachMessageMock,
  }),
);

vi.mock("@/client/leads/outreach/lead-outreach-clipboard-service", () => ({
  copyTextToClipboard: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  checkOutreachProvidersMock.mockResolvedValue({
    local: { running: true, modelLoaded: true, modelName: "qwen3-14b" },
    openai: false,
    openaiModel: null,
  });

  generateOutreachMessageMock.mockResolvedValue({
    ok: true,
    channel: OutreachChannel.Linkedin,
    promptKey: OutreachPromptKey.FirstTouch,
    body: "Lokaler Entwurf",
  });

  generateLocalOutreachMessageMock.mockResolvedValue("Lokaler Entwurf");
});

const content: LeadsOutreachDictionary = {
  triggerLabel: "Draft outreach",
  dialog: {
    eyebrow: "AI draft",
    title: "Draft outreach",
    description: "Create a short message.",
    closeAriaLabel: "Close dialog",
  },
  prompt: {
    label: "Template",
    descriptions: {
      "first-touch": "First touch",
    },
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
  improvements: {
    label: "Include improvements",
    help: "At most 2 notes.",
    disabledHint: "No improvements available.",
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
    localActive: "Local model active",
    localNoModel: "Local provider active · No model loaded",
    cloudFallback: "OpenAI fallback active",
    noProvider: "No provider available",
    localFailed: "Local generation failed",
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
  it("shows the yellow local provider badge when LM Studio has no loaded model", async () => {
    checkOutreachProvidersMock.mockResolvedValueOnce({
      local: { running: true, modelLoaded: false },
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

    const badge = await screen.findByText(content.status.localNoModel);
    expect(badge.getAttribute("data-state")).toBe("local-no-model");

    await waitFor(() => {
      const generateButton = screen.getByRole("button", {
        name: content.buttons.generate,
      });
      expect(generateButton.hasAttribute("disabled")).toBe(false);
    });
  });

  it("uses the local generator even when lead facts are unavailable", async () => {
    render(
      <LeadOutreachDialog
        content={content}
        leadDisplayName="Muster Lead"
        leadId="lead-1"
        onCloseAction={vi.fn()}
        refreshToken={0}
      />,
    );

    await screen.findByText(/Local model active .*qwen3-14b/i);
    fireEvent.click(
      screen.getByRole("button", {
        name: content.buttons.generate,
      }),
    );

    await waitFor(() => {
      expect(generateLocalOutreachMessageMock).toHaveBeenCalledTimes(1);
      expect(generateOutreachMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          clientGeneratedRawText: "Lokaler Entwurf",
          provider: OutreachProvider.LocalLmStudio,
          leadId: "lead-1",
        }),
      );
    });
  });
});
