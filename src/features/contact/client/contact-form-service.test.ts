import { describe, expect, it, vi } from "vitest";
import {
  createQuickContactMailtoHref,
  submitProjectRequest,
} from "./contact-form-service";

describe("contact-form-service", () => {
  it("submits a project request dto as json", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, requestId: "req_123" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await submitProjectRequest(
      {
        consentAccepted: true,
        email: "max@example.com",
        fullName: "Max Mustermann",
        locale: "de",
        offerKey: "landing",
        projectDetails: "Landingpage fuer qualifizierte Leads.",
        startedAt: "2026-04-09T10:00:00.000Z",
      },
      {
        submitPath: "/api/public/contact",
      },
    );

    expect(response).toEqual({ ok: true, requestId: "req_123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/contact",
      expect.objectContaining({
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          fullName: "Max Mustermann",
          locale: "de",
          offerKey: "landing",
          projectDetails: "Landingpage fuer qualifizierte Leads.",
          startedAt: "2026-04-09T10:00:00.000Z",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
  });

  it("creates the quick-contact mailto href from the dto", () => {
    const mailtoHref = createQuickContactMailtoHref(
      {
        consentAccepted: true,
        email: "max@example.com",
        fullName: "Max Mustermann",
        message: "Wir brauchen eine kurze Einschaetzung.",
      },
      {
        channelValue: "hi@invessiv.de",
        emailLabel: "E-Mail",
        fullNameLabel: "Name",
        intro: "Hallo, hier ist eine kurze Anfrage ueber die Website.",
        subject: "Kurze Anfrage ueber invessiv.de",
      },
    );

    expect(mailtoHref).toContain("mailto:hi@invessiv.de");
    expect(mailtoHref).toContain(
      "subject=Kurze%20Anfrage%20ueber%20invessiv.de",
    );
    expect(mailtoHref).toContain("Name%3A%20Max%20Mustermann");
    expect(mailtoHref).toContain("E-Mail%3A%20max%40example.com");
  });
});
