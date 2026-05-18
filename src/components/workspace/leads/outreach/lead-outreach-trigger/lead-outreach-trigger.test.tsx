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

vi.mock("@/client/leads/outreach/lead-outreach-generation-service", () => ({
  outreachGenerationClientService: {
    generateOutreachMessage: mockGenerateOutreachMessage,
  },
}));

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
  mockCheckOutreachProviders.mockResolvedValue({
    local: { running: false },
    openai: true,
    openaiModel: OutreachOpenAi.DefaultModel,
  });
  mockGenerateOutreachMessage.mockResolvedValue({
    ok: true,
    channel: OutreachChannel.Linkedin,
    body: "Hi Anna, kurzer Gedanke zu eurer Website.",
  });
});

afterEach(() => {
  cleanup();
});

describe("LeadOutreachTrigger", () => {
  it("opens the dialog and posts a minimal outreach request without prompt data", async () => {
    render(
      <LeadOutreachTrigger
        content={getLeadsOutreachDictionary("de")}
        lead={{
          displayName: "Anna Meyer",
          id: "lead-123",
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
          leadId: "lead-123",
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
      subject: "Kurzer Website-Gedanke",
      body: "Hallo Anna, ich habe eine kleine Beobachtung.",
    });

    render(
      <LeadOutreachTrigger
        content={getLeadsOutreachDictionary("de")}
        lead={{ displayName: "Anna Meyer", id: "lead-123" }}
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
});
