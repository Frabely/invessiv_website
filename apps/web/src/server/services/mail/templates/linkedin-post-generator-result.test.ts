import { describe, expect, it, vi } from "vitest";
import { createLinkedInPostGeneratorResultMessage } from "./linkedin-post-generator-result";

vi.mock("server-only", () => ({}));

const POST = {
  bodyVariant: "insight" as const,
  bullets: null,
  authorName: "Max Mustermann",
  colorPair: {
    accent: "#5BA3D9",
    id: "navy-steel",
    index: 0,
    primary: "#0F1B2D",
    secondary: "#1A3355",
    text: "#E8F1FA",
  },
  expertiseDisplay: "Strategieberatung",
  kicker: "Preisstrategie",
  headlineHtml: "Preise brauchen <em>Kontext</em>",
  headlinePlain: "Preise brauchen Kontext",
  highlight: null,
  insight: "Ein klares Angebot nimmt dem Gespräch den Druck.",
  template: {
    bodyVariant: "insight" as const,
    id: "editorial-center",
    index: 0,
  },
};

describe("createLinkedInPostGeneratorResultMessage", () => {
  it("creates a localized German message with caption and attachments", async () => {
    const message = await createLinkedInPostGeneratorResultMessage({
      caption: "Caption\n\n#B2B #LinkedIn",
      downloadFileName: "post.png",
      locale: "de",
      post: POST,
      to: "max@example.com",
    });

    expect(message.subject).toContain("Dein LinkedIn-Post ist bereit");
    expect(message.text).toContain("Caption");
    expect(message.to).toBe("max@example.com");
    expect(message.attachments).toHaveLength(2);
    expect(message.attachments?.[0]?.filename).toBe("post.svg");
    expect(message.attachments?.[1]?.filename).toBe("post.txt");
  });

  it("attaches the server PNG as the deliverable when provided", async () => {
    const png = Buffer.from("fake-png-bytes");
    const message = await createLinkedInPostGeneratorResultMessage({
      caption: "Caption\n\n#B2B #LinkedIn",
      downloadFileName: "post.png",
      locale: "de",
      png,
      post: POST,
      to: "max@example.com",
    });

    expect(message.attachments?.[0]?.filename).toBe("post.png");
    expect(message.attachments?.[0]?.content).toBe(png.toString("base64"));
  });

  it("creates a localized English message", async () => {
    const message = await createLinkedInPostGeneratorResultMessage({
      caption: "Caption\n\n#B2B #LinkedIn",
      downloadFileName: "post.png",
      locale: "en",
      post: POST,
      to: "max@example.com",
    });

    expect(message.subject).toContain("Your LinkedIn post is ready");
  });

  it("uses the development prefix in local dev mode", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const message = await createLinkedInPostGeneratorResultMessage({
      caption: "Caption\n\n#B2B #LinkedIn",
      downloadFileName: "post.png",
      locale: "de",
      post: POST,
      to: "max@example.com",
    });

    expect(message.subject).toContain("[DEV] ");
    vi.unstubAllEnvs();
  });
});
