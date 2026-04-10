import { describe, expect, it, vi } from "vitest";
import {
  createDiscoveryCallLeadWrite,
  createProjectRequestLeadWrite,
  createQuickContactLeadWrite,
} from "@/server/services/contact/contact-lead-metadata";

vi.mock("server-only", () => ({}));

describe("contact lead metadata", () => {
  it("maps a project request into lead, submission, and detail records", () => {
    const write = createProjectRequestLeadWrite(
      {
        budgetKey: "between_2500_5000",
        company: "Invessiv GmbH",
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        goalKey: "generate_inquiries",
        kind: "project_request",
        lastName: "Mustermann",
        locale: "de",
        offerKey: "landing",
        customPageNames: ["Karriereseite"],
        pageKeys: ["home", "contact"],
        phone: "+49 151 23456789",
        preferredStartKey: "within_two_weeks",
        projectDetails: "Eine Landingpage fuer qualifizierte Leads.",
        role: "Founder",
        startedAt: "2026-03-26T09:00:00.000Z",
        website: "https://example.com",
        workflowKey: undefined,
      },
      "request_123",
      new Date("2026-03-26T09:30:00.000Z"),
    );

    expect(write.lead.email).toBe("max@example.com");
    expect(write.lead.leadStatus).toBe("new");
    expect(write.submission.requestId).toBe("request_123");
    expect(write.submission.channel).toBe("project_request");
    expect(write.submission.submissionStartedAt).toBe(
      "2026-03-26T09:00:00.000Z",
    );
    expect(write.projectRequest.leadSubmissionId).toBe(write.submission.id);
    expect(write.projectRequest.customPageNames).toEqual(["Karriereseite"]);
    expect(write.projectRequest.pageKeys).toEqual(["home", "contact"]);
  });

  it("maps a quick contact into lead, submission, and email contact records", () => {
    const write = createQuickContactLeadWrite(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        kind: "quick_contact",
        lastName: "Mustermann",
        locale: "de",
        message: "Kurze erste Anfrage.",
      },
      "request_456",
      new Date("2026-03-26T09:30:00.000Z"),
    );

    expect(write.submission.channel).toBe("quick_contact");
    expect(write.submission.submissionStartedAt).toBeUndefined();
    expect(write.emailContact.leadSubmissionId).toBe(write.submission.id);
    expect(write.emailContact.message).toBe("Kurze erste Anfrage.");
  });

  it("maps a discovery call into lead, submission, and call contact records", () => {
    const write = createDiscoveryCallLeadWrite(
      {
        consentAccepted: true,
        email: "max@example.com",
        firstName: "Max",
        kind: "discovery_call",
        lastName: "Mustermann",
        locale: "de",
        message: "Wir wollen den Umfang kurz einordnen.",
      },
      "request_789",
      new Date("2026-03-26T09:30:00.000Z"),
    );

    expect(write.submission.channel).toBe("discovery_call");
    expect(write.callContact.leadSubmissionId).toBe(write.submission.id);
    expect(write.callContact.message).toBe(
      "Wir wollen den Umfang kurz einordnen.",
    );
  });
});
