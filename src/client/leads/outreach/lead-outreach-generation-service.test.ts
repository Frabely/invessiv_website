import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OutreachChannel } from "@/common/constants/leads/outreach/lead-outreach-channels";
import { OutreachErrorCode } from "@/common/constants/leads/outreach/lead-outreach-error-codes";
import { LeadOutreachApiEndpoints } from "@/common/constants/leads/outreach/lead-outreach-api-endpoints";
import { outreachGenerationClientService } from "./lead-outreach-generation-service";

describe("lead-outreach-generation-service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the request to the server generate endpoint", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      Response.json({
        ok: true,
        channel: OutreachChannel.Email,
        subject: "Kurzer Website-Gedanke",
        body: "Hallo Anna, ich habe eine kleine Beobachtung.",
      }),
    );

    const result =
      await outreachGenerationClientService.generateOutreachMessage({
        channel: OutreachChannel.Email,
        contextNote: "Bitte knapp",
        leadId: "lead-123",
      });

    expect(result).toMatchObject({
      ok: true,
      channel: OutreachChannel.Email,
      subject: "Kurzer Website-Gedanke",
      body: "Hallo Anna, ich habe eine kleine Beobachtung.",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      LeadOutreachApiEndpoints.Generate,
      expect.objectContaining({
        body: JSON.stringify({
          channel: OutreachChannel.Email,
          contextNote: "Bitte knapp",
          leadId: "lead-123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
  });

  it("maps an api error code from the server response", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          error: OutreachErrorCode.NotConfigured,
          message: "Nicht konfiguriert",
        },
        { status: 503 },
      ),
    );

    const result =
      await outreachGenerationClientService.generateOutreachMessage({
        channel: OutreachChannel.Linkedin,
        contextNote: "Bitte knapp",
        leadId: "lead-123",
      });

    expect(result).toEqual({
      ok: false,
      code: OutreachErrorCode.NotConfigured,
    });
  });
});
