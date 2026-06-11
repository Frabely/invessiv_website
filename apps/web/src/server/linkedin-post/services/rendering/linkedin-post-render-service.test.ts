import { describe, expect, it, vi } from "vitest";
import { LinkedInPostBodyVariant } from "@/common/contracts/generator/post/linkedin-post-body-variant";
import type { LinkedInPostGeneratorPostDto } from "@/common/contracts/generator";
import { linkedinPostRenderService } from "./linkedin-post-render-service";

vi.mock("server-only", () => ({}));

const POST: LinkedInPostGeneratorPostDto = {
  authorName: "Max Mustermann",
  bodyVariant: LinkedInPostBodyVariant.Bullets,
  bullets: [
    "Start with the decision your reader already has to make.",
    "Make the tradeoff visible before you add advice.",
    "Close with one concrete next step.",
  ],
  colorPair: {
    accent: "#7BE0AD",
    id: "test",
    index: 0,
    primary: "#101820",
    secondary: "#243B4A",
    text: "#F4F7F5",
  },
  expertiseDisplay: "Consulting",
  headlineHtml: "Better <em>client calls</em>",
  headlinePlain: "Better client calls",
  highlight: null,
  insight: null,
  kicker: "Sales",
  template: {
    bodyVariant: LinkedInPostBodyVariant.Bullets,
    id: "index-checklist",
    index: 4,
  },
};

describe("linkedinPostRenderService", () => {
  it("renders the generated post as SVG", () => {
    const svg = linkedinPostRenderService.renderLinkedInPostSvg(POST);

    expect(svg).toContain("<svg");
    expect(svg).toContain("Better client calls");
    expect(svg).toContain("Start with the decision");
  });

  it("renders the generated post SVG as a PNG buffer", async () => {
    const png = await linkedinPostRenderService.renderLinkedInPostPng(POST);

    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });
});
