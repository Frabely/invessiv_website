import { describe, expect, it, vi } from "vitest";
import {
  createCalendlyPrefillHref,
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
        kind: "project_request",
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
          kind: "project_request",
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
        kind: "quick_contact",
        locale: "de",
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

  it("creates a Calendly prefill href with name, email, and the first custom answer", () => {
    const calendlyHref = createCalendlyPrefillHref(
      {
        email: "max@example.com",
        fullName: "Max Mustermann",
        message: "Wir wollen den Umfang kurz einordnen.",
      },
      {
        calendlyUrl: "https://calendly.com/service-invessiv-cxf5/30min",
      },
    );

    expect(calendlyHref).toContain("name=Max+Mustermann");
    expect(calendlyHref).toContain("email=max%40example.com");
    expect(calendlyHref).toContain(
      "a1=Wir+wollen+den+Umfang+kurz+einordnen.",
    );
  });

  it("keeps existing Calendly query params and omits a1 when concern is empty", () => {
    const calendlyHref = createCalendlyPrefillHref(
      {
        email: "max@example.com",
        fullName: "Max Mustermann",
        message: "   ",
      },
      {
        calendlyUrl:
          "https://calendly.com/service-invessiv-cxf5/30min?month=2026-04",
      },
    );

    expect(calendlyHref).toContain("month=2026-04");
    expect(calendlyHref).toContain("name=Max+Mustermann");
    expect(calendlyHref).toContain("email=max%40example.com");
    expect(calendlyHref).not.toContain("a1=");
  });
});
