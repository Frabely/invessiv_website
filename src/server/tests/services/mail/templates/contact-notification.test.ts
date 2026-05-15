import { describe, expect, it, vi } from "vitest";
import { createContactNotificationMessage } from "@/server/services/mail/templates/contact-notification";

vi.mock("server-only", () => ({}));

describe("createContactNotificationMessage", () => {
  it("prefixes subjects with DEV in development", async () => {
    vi.stubEnv("VERCEL_ENV", "development");

    const message = await createContactNotificationMessage({
      company: undefined,
      consentAccepted: true,
      customPageNames: undefined,
      email: "max@example.com",
      displayName: "Max Mustermann",
      goalKey: "generate_inquiries",
      kind: "project_request",
      locale: "de",
      offerKey: "landing",
      pageKeys: ["home", "contact"],
      phone: undefined,
      projectDetails: "Kurzbeschreibung",
      role: undefined,
      startedAt: "2026-03-20T10:00:00.000Z",
      website: undefined,
    });

    expect(message.subject).toMatch(/^\[DEV\] \[/);

    vi.unstubAllEnvs();
  });

  it("prefixes subjects with PREVIEW in preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    const message = await createContactNotificationMessage({
      company: undefined,
      consentAccepted: true,
      customPageNames: undefined,
      email: "max@example.com",
      displayName: "Max Mustermann",
      goalKey: "generate_inquiries",
      kind: "project_request",
      locale: "de",
      offerKey: "landing",
      pageKeys: ["home", "contact"],
      phone: undefined,
      projectDetails: "Kurzbeschreibung",
      role: undefined,
      startedAt: "2026-03-20T10:00:00.000Z",
      website: undefined,
    });

    expect(message.subject).toMatch(/^\[PREVIEW\] \[/);

    vi.unstubAllEnvs();
  });

  it("formats labels with quotes and maps internal keys to readable values", async () => {
    vi.stubEnv("VERCEL_ENV", "production");

    const message = await createContactNotificationMessage({
      company: undefined,
      consentAccepted: true,
      customPageNames: ["Sponsoren"],
      email: "max@example.com",
      displayName: "Max Mustermann",
      goalKey: "generate_inquiries",
      kind: "project_request",
      locale: "de",
      offerKey: "landing",
      pageKeys: ["home", "contact"],
      phone: undefined,
      projectDetails: "Kurzbeschreibung",
      role: undefined,
      startedAt: "2026-03-20T10:00:00.000Z",
      website: undefined,
    });

    expect(message.subject).not.toMatch(/^\[(DEV|PREVIEW)\]/);
    expect(message.subject).toContain("Landingpages");
    expect(message.text).toContain('"Angebot": Landingpages');
    expect(message.text).toContain("Start, Kontakt");
    expect(message.text).toContain('"Weitere Seiten": Sponsoren');
    expect(message.html).toContain('"Angebot":');

    vi.unstubAllEnvs();
  });
});
