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
import { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { getLeadsOutreachDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadOutreachTrigger } from "./lead-outreach-trigger";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const { mockGenerateOutreachMessage } = vi.hoisted(() => ({
  mockGenerateOutreachMessage: vi.fn(),
}));

vi.mock("@/client/leads/outreach/lead-outreach-generation-service", () => ({
  generateOutreachMessage: mockGenerateOutreachMessage,
}));

beforeEach(() => {
  refreshMock.mockReset();
  mockGenerateOutreachMessage.mockReset();
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
      screen.getByPlaceholderText(
        "Zum Beispiel: in English, mit klarerem CTA oder kürzerem Ton.",
      ),
      {
        target: { value: "in English" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Generieren" }));

    await waitFor(() => {
      expect(mockGenerateOutreachMessage).toHaveBeenCalledWith({
        channel: OutreachChannel.Linkedin,
        contextNote: "in English",
        includeImprovements: true,
        leadId: "lead-123",
        promptKey: OutreachPromptKey.FirstTouch,
      });
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
      screen.getByText("Für diesen Lead sind keine Verbesserungen hinterlegt."),
    ).toBeInTheDocument();
  });
});
