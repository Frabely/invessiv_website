import { describe, expect, it, vi } from "vitest";
import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import { outreachSkillContextService } from "@/server/workspace/outreach/services/outreach-skill-context-service";

vi.mock("server-only", () => ({}));

const makeLead = (overrides: Partial<LeadDetailDto> = {}): LeadDetailDto => ({
  id: "lead-1",
  displayName: "Max Mustermann",
  firstName: "Max",
  lastName: "Mustermann",
  companyName: "ACME GmbH",
  email: "max@acme.com",
  phone: "+49 123 456789",
  websiteUrl: "https://acme.de",
  score: 75,
  source: "manual" as LeadDetailDto["source"],
  leadStatus: "new" as LeadDetailDto["leadStatus"],
  owner: "Moritz",
  notes: "Hat gute Bewertungen",
  improvements: [
    "SEO verbessern",
    "Mobile-Optimierung",
    "Schnellere Ladezeiten",
  ],
  externalGuid: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  category: { id: "cat-1", slug: "handwerk", labelKey: "Handwerk" },
  socialProfiles: [],
  activities: [],
  submissions: [],
  ...overrides,
});

describe("outreachSkillContextService", () => {
  it("loads the outreach skill markdown from the local skill file", async () => {
    const markdown = await outreachSkillContextService.loadSkillMarkdown();

    expect(markdown).toContain("Invessiv Outreach Skill");
    expect(markdown).toContain("Required Inputs");
  });

  it("builds a structured prompt without PII and with derived website state", async () => {
    const { systemPrompt, userPrompt } =
      await outreachSkillContextService.buildSkillPrompts({
        lead: makeLead({ websiteUrl: null }),
        channel: OutreachChannel.Email,
        contextNote: "Bitte kurz und freundlich",
      });

    expect(systemPrompt).toContain("Invessiv Outreach Skill");
    expect(userPrompt).toContain('"websiteExists": false');
    expect(userPrompt).toContain('"requiresSubject": true');
    expect(userPrompt).toContain('"contextNote": "Bitte kurz und freundlich"');
    expect(userPrompt).not.toContain("max@acme.com");
    expect(userPrompt).not.toContain("+49 123 456789");
  });

  it("includes capped improvements when a website exists", async () => {
    const { userPrompt } = await outreachSkillContextService.buildSkillPrompts({
      lead: makeLead(),
      channel: OutreachChannel.Linkedin,
      contextNote: "  In English  ",
    });

    expect(userPrompt).toContain('"improvements": [');
    expect(userPrompt).toContain('"In English"');
    expect(userPrompt).not.toContain("Schnellere Ladezeiten");
  });

  it("omits improvements when no website exists", async () => {
    const { userPrompt } = await outreachSkillContextService.buildSkillPrompts({
      lead: makeLead({ websiteUrl: null }),
      channel: OutreachChannel.Linkedin,
    });

    expect(userPrompt).toContain('"websiteExists": false');
    expect(userPrompt).toContain('"improvements": []');
  });
});
