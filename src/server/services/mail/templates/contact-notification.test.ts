import { describe, expect, it, vi } from "vitest";
import { createContactNotificationMessage } from "@/server/services/mail/templates/contact-notification";

vi.mock("server-only", () => ({}));

describe("createContactNotificationMessage", () => {
  it("formats labels with quotes and maps internal keys to readable values", async () => {
    const message = await createContactNotificationMessage({
      company: undefined,
      consentAccepted: true,
      email: "max@example.com",
      fullName: "Max Mustermann",
      goalKey: "generate_inquiries",
      locale: "de",
      offerKey: "landing",
      pagesCustom: undefined,
      pageKeys: ["home", "contact"],
      phone: undefined,
      projectDetails: "Kurzbeschreibung",
      role: undefined,
      startedAt: "2026-03-20T10:00:00.000Z",
      website: undefined,
    });

    expect(message.subject).toContain("Landingpages");
    expect(message.text).toContain('"Angebot": Landingpages');
    expect(message.text).toContain('"Benötigte Seiten": Start, Kontakt');
    expect(message.html).toContain('"Angebot":');
  });
});
