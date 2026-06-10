import { describe, expect, it, vi } from "vitest";
import { CONTACT_GOAL_KEY } from "@invessiv/common/constants/contact/contact-goal-keys";
import { CONTACT_OFFER_KEY } from "@invessiv/common/constants/contact/contact-offer-keys";
import { CONTACT_PAGE_KEY } from "@invessiv/common/constants/contact/contact-page-keys";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import { CONTACT_WORKFLOW_KEY } from "@invessiv/common/constants/contact/contact-workflow-keys";
import { createContactNotificationMessage } from "./contact-notification";

vi.mock("server-only", () => ({}));

describe("createContactNotificationMessage", () => {
  it("uses the new canonical web offer label for landing and legacy web values", async () => {
    const landingMessage = await createContactNotificationMessage({
      consentAccepted: true,
      email: "max@example.com",
      displayName: "Max Mustermann",
      goalKey: CONTACT_GOAL_KEY.GenerateInquiries,
      kind: CONTACT_REQUEST_KIND.ProjectRequest,
      locale: "de",
      offerKey: CONTACT_OFFER_KEY.Landing,
      pageKeys: [CONTACT_PAGE_KEY.Home, CONTACT_PAGE_KEY.Contact],
      projectDetails:
        "Eine Landingpage für qualifizierte Anfragen mit klarem Anfrageweg.",
      startedAt: "2026-03-20T10:00:00.000Z",
    });
    const legacyWebMessage = await createContactNotificationMessage({
      consentAccepted: true,
      email: "max@example.com",
      displayName: "Max Mustermann",
      kind: CONTACT_REQUEST_KIND.ProjectRequest,
      locale: "de",
      offerKey: CONTACT_OFFER_KEY.Web,
      pageKeys: [CONTACT_PAGE_KEY.Home],
      projectDetails:
        "Eine Website mit klarer Struktur und besserem Anfrageweg.",
      startedAt: "2026-03-20T10:00:00.000Z",
    });

    expect(landingMessage.subject).toContain("Webauftritt & Landingpages");
    expect(landingMessage.text).toContain(
      '"Angebot": Webauftritt & Landingpages',
    );
    expect(legacyWebMessage.text).toContain(
      '"Angebot": Webauftritt & Landingpages',
    );
  });

  it("uses the new process offer label and keeps workflow details", async () => {
    const message = await createContactNotificationMessage({
      consentAccepted: true,
      email: "max@example.com",
      displayName: "Max Mustermann",
      kind: CONTACT_REQUEST_KIND.ProjectRequest,
      locale: "de",
      offerKey: CONTACT_OFFER_KEY.Process,
      projectDetails:
        "Ein wiederkehrender Ablauf soll sauberer vorbereitet werden.",
      startedAt: "2026-03-20T10:00:00.000Z",
      workflowKey: CONTACT_WORKFLOW_KEY.SimplifyManualProcess,
    });

    expect(message.subject).toContain(
      "Prozessoptimierung & digitale Workflows",
    );
    expect(message.text).toContain(
      '"Angebot": Prozessoptimierung & digitale Workflows',
    );
    expect(message.text).toContain(
      '"Art des Vorhabens": Manuellen Prozess vereinfachen',
    );
  });
});
