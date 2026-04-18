import { describe, expect, it, vi } from "vitest";
import {
  createCalendlyPrefillHref,
  submitDiscoveryCall,
  submitQuickContact,
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
        firstName: "Max",
        kind: "project_request",
        lastName: "Mustermann",
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
          firstName: "Max",
          kind: "project_request",
          lastName: "Mustermann",
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

  it("submits a quick contact dto as json", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, requestId: "req_456" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await submitQuickContact(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        kind: "quick_contact",
        lastName: "Mustermann",
        locale: "de",
        message: "Wir brauchen eine kurze Einschaetzung.",
      },
      {
        submitPath: "/api/public/contact",
      },
    );

    expect(response).toEqual({ ok: true, requestId: "req_456" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/contact",
      expect.objectContaining({
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          firstName: "Max",
          kind: "quick_contact",
          lastName: "Mustermann",
          locale: "de",
          message: "Wir brauchen eine kurze Einschaetzung.",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
  });

  it("submits a discovery call dto as json", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, requestId: "req_789" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await submitDiscoveryCall(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        kind: "discovery_call",
        lastName: "Mustermann",
        locale: "de",
        message: "Wir wollen den Umfang kurz einordnen.",
      },
      {
        submitPath: "/api/public/contact",
      },
    );

    expect(response).toEqual({ ok: true, requestId: "req_789" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/contact",
      expect.objectContaining({
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          firstName: "Max",
          kind: "discovery_call",
          lastName: "Mustermann",
          locale: "de",
          message: "Wir wollen den Umfang kurz einordnen.",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );
  });

  it("creates a Calendly prefill href with name, email, and the first custom answer", () => {
    const calendlyHref = createCalendlyPrefillHref(
      {
        email: "max@example.com",
        firstName: "Max",
        lastName: "Mustermann",
        message: "Wir wollen den Umfang kurz einordnen.",
      },
      {
        calendlyUrl: "https://calendly.com/service-invessiv-cxf5/30min",
      },
    );

    expect(calendlyHref).toContain("name=Max+Mustermann");
    expect(calendlyHref).toContain("email=max%40example.com");
    expect(calendlyHref).toContain("a1=Wir+wollen+den+Umfang+kurz+einordnen.");
  });

  it("keeps existing Calendly query params and omits a1 when concern is empty", () => {
    const calendlyHref = createCalendlyPrefillHref(
      {
        email: "max@example.com",
        firstName: "Max",
        lastName: "Mustermann",
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
