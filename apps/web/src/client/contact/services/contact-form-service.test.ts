import { describe, expect, it, vi } from "vitest";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";
import { WebApiEndpoint } from "@/common/constants";
import {
  createCalendlyPrefillHref,
  submitDiscoveryCall,
  submitProjectRequest,
  submitQuickContact,
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
        displayName: "Max Mustermann",
        kind: "project_request",
        locale: "de",
        offerKey: "landing",
        projectDetails: "Landingpage für qualifizierte Leads.",
        startedAt: "2026-04-09T10:00:00.000Z",
      },
      {
        submitPath: WebApiEndpoint.ContactSubmit,
      },
    );

    expect(response).toEqual({ ok: true, requestId: "req_123" });
    expect(fetchMock).toHaveBeenCalledWith(
      WebApiEndpoint.ContactSubmit,
      expect.objectContaining({
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          displayName: "Max Mustermann",
          kind: "project_request",
          locale: "de",
          offerKey: "landing",
          projectDetails: "Landingpage für qualifizierte Leads.",
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
        displayName: "Max Mustermann",
        kind: CONTACT_REQUEST_KIND.QuickContact,
        locale: "de",
        message: "Wir brauchen eine kurze Einschätzung.",
      },
      {
        submitPath: WebApiEndpoint.ContactSubmit,
      },
    );

    expect(response).toEqual({ ok: true, requestId: "req_456" });
    expect(fetchMock).toHaveBeenCalledWith(
      WebApiEndpoint.ContactSubmit,
      expect.objectContaining({
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          displayName: "Max Mustermann",
          kind: CONTACT_REQUEST_KIND.QuickContact,
          locale: "de",
          message: "Wir brauchen eine kurze Einschätzung.",
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
        displayName: "Max Mustermann",
        kind: "discovery_call",
        locale: "de",
        message: "Wir wollen den Umfang kurz einordnen.",
        origin: ContactSubmissionOrigin.Website,
        projectScope: "compact_website",
      },
      {
        submitPath: WebApiEndpoint.ContactSubmit,
      },
    );

    expect(response).toEqual({ ok: true, requestId: "req_789" });
    expect(fetchMock).toHaveBeenCalledWith(
      WebApiEndpoint.ContactSubmit,
      expect.objectContaining({
        body: JSON.stringify({
          consentAccepted: true,
          email: "max@example.com",
          displayName: "Max Mustermann",
          kind: "discovery_call",
          locale: "de",
          message: "Wir wollen den Umfang kurz einordnen.",
          origin: ContactSubmissionOrigin.Website,
          projectScope: "compact_website",
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
        displayName: "Max Mustermann",
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
        displayName: "Max Mustermann",
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

  it("writes the project scope label into the second Calendly answer slot", () => {
    const calendlyHref = createCalendlyPrefillHref(
      {
        email: "max@example.com",
        displayName: "Max Mustermann",
        message: "Kurz den Umfang einordnen.",
      },
      {
        calendlyUrl: "https://calendly.com/service-invessiv-cxf5/30min",
        projectScopeLabel: "Kompakte Website",
      },
    );

    expect(calendlyHref).toContain("a1=Kurz+den+Umfang+einordnen.");
    expect(calendlyHref).toContain("a2=Kompakte+Website");
  });

  it("omits a2 when no project scope label is given", () => {
    const calendlyHref = createCalendlyPrefillHref(
      {
        email: "max@example.com",
        displayName: "Max Mustermann",
        message: "Kurz den Umfang einordnen.",
      },
      {
        calendlyUrl: "https://calendly.com/service-invessiv-cxf5/30min?a2=alt",
        projectScopeLabel: "   ",
      },
    );

    expect(calendlyHref).not.toContain("a2=");
  });
});
