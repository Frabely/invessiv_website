// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import { OutreachOpenAi } from "@/common/ai-outreach-generation/outreach-lm-studio";
import { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { OutreachProvider } from "@/common/constants/workspace/leads/ai-outreach-generation/outreach-provider";
import { getLeadsOutreachDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadOutreachTrigger } from "./lead-outreach-trigger";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const { mockGenerateOutreachMessage, mockCheckOutreachProviders } = vi.hoisted(
  () => ({
    mockGenerateOutreachMessage: vi.fn(),
    mockCheckOutreachProviders: vi.fn(),
  }),
);
const mockGenerateLocalOutreachMessage = vi.hoisted(() => vi.fn());

vi.mock("@/client/leads/outreach/lead-outreach-generation-service", () => ({
  outreachGenerationClientService: {
    generateOutreachMessage: mockGenerateOutreachMessage,
  },
}));

vi.mock(
  "@/client/leads/outreach/lead-outreach-local-generation-service",
  () => ({
    outreachLocalGenerationService: {
      generateLocalOutreachMessage: mockGenerateLocalOutreachMessage,
    },
  }),
);

vi.mock(
  "@/client/leads/outreach/lead-outreach-provider-status-service",
  () => ({
    outreachProviderStatusService: {
      checkOutreachProviders: mockCheckOutreachProviders,
    },
  }),
);

beforeEach(() => {
  refreshMock.mockReset();
  mockGenerateOutreachMessage.mockReset();
  mockCheckOutreachProviders.mockReset();
  mockGenerateLocalOutreachMessage.mockReset();
  mockCheckOutreachProviders.mockResolvedValue({
    local: { running: false },
    openai: true,
    openaiModel: OutreachOpenAi.DefaultModel,
  });
  mockGenerateOutreachMessage.mockResolvedValue({
    ok: true,
    channel: OutreachChannel.Linkedin,
    promptKey: OutreachPromptKey.FirstTouch,
    body: "Hi Anna, kurzer Gedanke zu eurer Website.",
  });
});

afterEach(() => {
  cleanup();
});

describe("LeadOutreachTrigger", () => {
  it("opens the dialog and posts a minimal outreach request without lead PII", async () => {
    render(
      <LeadOutreachTrigger
        content={getLeadsOutreachDictionary("de")}
        lead={{
          displayName: "Anna Meyer",
          id: "lead-123",
          improvements: ["Hero klarer machen"],
        }}
        variant="icon+text"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Outreach entwerfen" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: /Zusätzlicher Kontext/i }),
      {
        target: { value: "in English" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Generieren" }));

    await waitFor(() => {
      expect(mockGenerateOutreachMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: OutreachChannel.Linkedin,
          contextNote: "in English",
          includeImprovements: true,
          leadId: "lead-123",
          promptKey: OutreachPromptKey.FirstTouch,
          provider: OutreachProvider.OpenAi,
        }),
      );
    });

    expect(
      await screen.findByDisplayValue(
        "Hi Anna, kurzer Gedanke zu eurer Website.",
      ),
    ).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("renders email output as subject and body fields", async () => {
    mockGenerateOutreachMessage.mockResolvedValueOnce({
      ok: true,
      channel: OutreachChannel.Email,
      promptKey: OutreachPromptKey.FirstTouch,
      subject: "Kurzer Website-Gedanke",
      body: "Hallo Anna, ich habe eine kleine Beobachtung.",
    });

    render(
      <LeadOutreachTrigger
        content={getLeadsOutreachDictionary("de")}
        lead={{ displayName: "Anna Meyer", id: "lead-123", improvements: [] }}
        variant="icon+text"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Outreach entwerfen" }));
    fireEvent.click(screen.getByRole("button", { name: "E-Mail" }));
    fireEvent.click(screen.getByRole("button", { name: "Generieren" }));

    expect(
      await screen.findByDisplayValue("Kurzer Website-Gedanke"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Hallo Anna, ich habe eine kleine Beobachtung."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/keine Verbesserungen hinterlegt/i),
    ).toBeInTheDocument();
  });

  it("rechecks the local provider when the dialog is reopened", async () => {
    mockCheckOutreachProviders
      .mockResolvedValueOnce({
        local: { running: true, modelLoaded: false },
        openai: false,
        openaiModel: null,
      })
      .mockResolvedValueOnce({
        local: { running: true, modelLoaded: true, modelName: "qwen3-14b" },
        openai: false,
        openaiModel: null,
      });

    render(
      <LeadOutreachTrigger
        content={getLeadsOutreachDictionary("de")}
        lead={{
          displayName: "Anna Meyer",
          id: "lead-123",
          improvements: ["Hero klarer machen"],
        }}
        variant="icon+text"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Outreach entwerfen" }));
    expect(
      await screen.findByText(/Lokaler Provider aktiv · Kein Modell geladen/i),
    ).toBeInTheDocument();
    expect(mockCheckOutreachProviders).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Dialog schlie/i }));
    expect(
      screen.queryByText(/Lokaler Provider aktiv · Kein Modell geladen/i),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Outreach entwerfen" }));
    expect(
      await screen.findByText(/Lokales Modell aktiv · qwen3-14b/i),
    ).toBeInTheDocument();
    expect(mockCheckOutreachProviders).toHaveBeenCalledTimes(2);
  });

  it("uses the loaded local model name when generating locally", async () => {
    mockCheckOutreachProviders.mockResolvedValueOnce({
      local: { running: true, modelLoaded: true, modelName: "qwen3-14b" },
      openai: false,
      openaiModel: null,
    });
    mockGenerateLocalOutreachMessage.mockResolvedValueOnce("Lokaler Entwurf");
    mockGenerateOutreachMessage.mockResolvedValueOnce({
      ok: true,
      channel: OutreachChannel.Linkedin,
      promptKey: OutreachPromptKey.FirstTouch,
      body: "Lokaler Entwurf",
    });

    render(
      <LeadOutreachTrigger
        content={getLeadsOutreachDictionary("de")}
        lead={{
          displayName: "Anna Meyer",
          facts: {
            categoryLabel: "Website",
            companyName: "Meyer GmbH",
            firstName: "Anna",
            improvements: [],
            notes: null,
            owner: "Moritz",
            websiteUrl: "https://example.com",
          },
          id: "lead-123",
          improvements: ["Hero klarer machen"],
        }}
        variant="icon+text"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Outreach entwerfen" }));
    await screen.findByText(/Lokales Modell aktiv · qwen3-14b/i);
    fireEvent.click(screen.getByRole("button", { name: "Generieren" }));

    await waitFor(() => {
      expect(mockGenerateLocalOutreachMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        "qwen3-14b",
      );
    });

    expect(mockGenerateOutreachMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        clientGeneratedRawText: "Lokaler Entwurf",
        provider: OutreachProvider.LocalLmStudio,
      }),
    );
  });
});
