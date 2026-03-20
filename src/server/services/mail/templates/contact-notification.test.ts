import { describe, expect, it } from "vitest";
import { createContactNotificationMessage } from "@/server/services/mail/templates/contact-notification";

describe("createContactNotificationMessage", () => {
  it("formats labels with quotes and maps internal keys to readable values", () => {
    const message = createContactNotificationMessage({
      consentAccepted: true,
      email: "max@example.com",
      fullName: "Max Mustermann",
      goalKey: "generate_inquiries",
      locale: "de",
      offerKey: "landing",
      pageKeys: ["home", "contact"],
      projectDetails: "Kurzbeschreibung",
      startedAt: "2026-03-20T10:00:00.000Z",
    });

    expect(message.subject).toContain("Landingpages");
    expect(message.text).toContain('"Angebot": Landingpages');
    expect(message.text).toContain('"Benötigte Seiten": Start, Kontakt');
    expect(message.html).toContain('"Angebot":');
  });
});
