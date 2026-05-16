import { describe, expect, it } from "vitest";
import { outreachPromptService } from "@/server/workspace/outreach/services/outreach-prompt-service";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { OUTREACH_MAX_IMPROVEMENTS } from "@/common/ai-outreach-generation/outreach-defaults";

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

describe("outreachPromptService.sanitizeLeadFacts", () => {
  it("maps firstName, companyName, websiteUrl, notes, owner from lead", () => {
    const facts = outreachPromptService.sanitizeLeadFacts(makeLead());
    expect(facts.firstName).toBe("Max");
    expect(facts.companyName).toBe("ACME GmbH");
    expect(facts.websiteUrl).toBe("https://acme.de");
    expect(facts.notes).toBe("Hat gute Bewertungen");
    expect(facts.owner).toBe("Moritz");
  });

  it("extracts categoryLabel from category.labelKey", () => {
    const facts = outreachPromptService.sanitizeLeadFacts(makeLead());
    expect(facts.categoryLabel).toBe("Handwerk");
  });

  it("sets categoryLabel to null when category is null", () => {
    const facts = outreachPromptService.sanitizeLeadFacts(
      makeLead({ category: null }),
    );
    expect(facts.categoryLabel).toBeNull();
  });

  it("maps improvements array", () => {
    const facts = outreachPromptService.sanitizeLeadFacts(makeLead());
    expect(facts.improvements).toEqual([
      "SEO verbessern",
      "Mobile-Optimierung",
      "Schnellere Ladezeiten",
    ]);
  });

  it("returns empty improvements array when lead improvements is null", () => {
    const facts = outreachPromptService.sanitizeLeadFacts(
      makeLead({ improvements: null }),
    );
    expect(facts.improvements).toEqual([]);
  });

  it("does not include email field", () => {
    const facts = outreachPromptService.sanitizeLeadFacts(makeLead());
    expect(Object.keys(facts)).not.toContain("email");
  });

  it("does not include phone field", () => {
    const facts = outreachPromptService.sanitizeLeadFacts(makeLead());
    expect(Object.keys(facts)).not.toContain("phone");
  });
});

describe("outreachPromptService.buildPromptMessages — DSGVO", () => {
  const sensitiveEmail = "max@acme.com";
  const sensitivePhone = "+49 123 456789";
  const lead = makeLead({ email: sensitiveEmail, phone: sensitivePhone });
  const options = { includeImprovements: true };

  it("never includes email in systemPrompt", () => {
    const { systemPrompt } = outreachPromptService.buildPromptMessages(
      lead,
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      options,
    );
    expect(systemPrompt).not.toContain(sensitiveEmail);
  });

  it("never includes email in userPrompt", () => {
    const { userPrompt } = outreachPromptService.buildPromptMessages(
      lead,
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      options,
    );
    expect(userPrompt).not.toContain(sensitiveEmail);
  });

  it("never includes phone in systemPrompt", () => {
    const { systemPrompt } = outreachPromptService.buildPromptMessages(
      lead,
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      options,
    );
    expect(systemPrompt).not.toContain(sensitivePhone);
  });

  it("never includes phone in userPrompt", () => {
    const { userPrompt } = outreachPromptService.buildPromptMessages(
      lead,
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      options,
    );
    expect(userPrompt).not.toContain(sensitivePhone);
  });
});

describe("outreachPromptService.buildPromptMessages — Improvements", () => {
  it("caps improvements at OUTREACH_MAX_IMPROVEMENTS when includeImprovements=true", () => {
    const included = ["Improvement-Alpha", "Improvement-Beta"];
    const excluded = ["Improvement-Gamma", "Improvement-Delta"];
    const lead = makeLead({ improvements: [...included, ...excluded] });
    const { userPrompt } = outreachPromptService.buildPromptMessages(
      lead,
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      { includeImprovements: true },
    );
    expect(included.every((item) => userPrompt.includes(item))).toBe(true);
    expect(excluded.some((item) => userPrompt.includes(item))).toBe(false);
    expect(included.length).toBe(OUTREACH_MAX_IMPROVEMENTS);
  });

  it("excludes improvements from userPrompt when includeImprovements=false", () => {
    const lead = makeLead({ improvements: ["SEO verbessern", "Mobile-Opt"] });
    const { userPrompt } = outreachPromptService.buildPromptMessages(
      lead,
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      { includeImprovements: false },
    );
    expect(userPrompt).not.toContain("SEO verbessern");
    expect(userPrompt).not.toContain("Mobile-Opt");
  });
});

describe("outreachPromptService.buildPromptMessages — structure", () => {
  it("returns an object with systemPrompt and userPrompt strings", () => {
    const messages = outreachPromptService.buildPromptMessages(
      makeLead(),
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      { includeImprovements: false },
    );
    expect(typeof messages.systemPrompt).toBe("string");
    expect(typeof messages.userPrompt).toBe("string");
    expect(messages.systemPrompt.length).toBeGreaterThan(0);
    expect(messages.userPrompt.length).toBeGreaterThan(0);
  });

  it("includes channel-specific instructions in systemPrompt", () => {
    const { systemPrompt } = outreachPromptService.buildPromptMessages(
      makeLead(),
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Email,
      { includeImprovements: false },
    );
    expect(systemPrompt).toContain("Betreff");
  });

  it("includes lead firstName in userPrompt when present", () => {
    const { userPrompt } = outreachPromptService.buildPromptMessages(
      makeLead({ firstName: "Klaus" }),
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      { includeImprovements: false },
    );
    expect(userPrompt).toContain("Klaus");
  });

  it("omits Vorname line from userPrompt when firstName is null", () => {
    const { userPrompt } = outreachPromptService.buildPromptMessages(
      makeLead({ firstName: null }),
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      { includeImprovements: false },
    );
    expect(userPrompt).not.toContain("Vorname:");
  });

  it("includes contextNote in userPrompt when provided", () => {
    const { userPrompt } = outreachPromptService.buildPromptMessages(
      makeLead(),
      OutreachPromptKey.FirstTouch,
      OutreachChannel.Linkedin,
      { includeImprovements: false, contextNote: "Schreibt gerne über KI" },
    );
    expect(userPrompt).toContain("Schreibt gerne über KI");
  });
});
