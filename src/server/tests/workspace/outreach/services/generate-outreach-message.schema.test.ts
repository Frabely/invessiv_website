import { describe, expect, it } from "vitest";
import { generateOutreachMessageSchema } from "@/server/workspace/outreach/generate-outreach-message.schema";
import { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { OUTREACH_CONTEXT_NOTE_MAX_LEN } from "@/common/ai-outreach-generation/outreach-defaults";

const VALID_BASE = {
  leadId: "123e4567-e89b-12d3-a456-426614174000",
  promptKey: OutreachPromptKey.FirstTouch,
  channel: OutreachChannel.Linkedin,
  includeImprovements: true,
};

describe("generateOutreachMessageSchema", () => {
  describe("valid inputs", () => {
    it("accepts minimal valid input", () => {
      expect(generateOutreachMessageSchema.safeParse(VALID_BASE).success).toBe(
        true,
      );
    });

    it("accepts all channels", () => {
      for (const channel of Object.values(OutreachChannel)) {
        expect(
          generateOutreachMessageSchema.safeParse({ ...VALID_BASE, channel })
            .success,
        ).toBe(true);
      }
    });

    it("accepts all promptKeys", () => {
      for (const promptKey of Object.values(OutreachPromptKey)) {
        expect(
          generateOutreachMessageSchema.safeParse({ ...VALID_BASE, promptKey })
            .success,
        ).toBe(true);
      }
    });

    it("accepts includeImprovements=false", () => {
      expect(
        generateOutreachMessageSchema.safeParse({
          ...VALID_BASE,
          includeImprovements: false,
        }).success,
      ).toBe(true);
    });

    it("accepts optional contextNote within limit", () => {
      expect(
        generateOutreachMessageSchema.safeParse({
          ...VALID_BASE,
          contextNote: "a".repeat(OUTREACH_CONTEXT_NOTE_MAX_LEN),
        }).success,
      ).toBe(true);
    });

    it("accepts missing contextNote (field optional)", () => {
      const { ...withoutNote } = VALID_BASE;
      expect(generateOutreachMessageSchema.safeParse(withoutNote).success).toBe(
        true,
      );
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing leadId", () => {
      const { leadId: omittedLeadId, ...rest } = VALID_BASE;
      void omittedLeadId;
      expect(generateOutreachMessageSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects empty leadId", () => {
      expect(
        generateOutreachMessageSchema.safeParse({
          ...VALID_BASE,
          leadId: "",
        }).success,
      ).toBe(false);
    });

    it("rejects unknown channel", () => {
      expect(
        generateOutreachMessageSchema.safeParse({
          ...VALID_BASE,
          channel: "whatsapp",
        }).success,
      ).toBe(false);
    });

    it("rejects unknown promptKey", () => {
      expect(
        generateOutreachMessageSchema.safeParse({
          ...VALID_BASE,
          promptKey: "unknown-key",
        }).success,
      ).toBe(false);
    });

    it("rejects contextNote exceeding limit", () => {
      expect(
        generateOutreachMessageSchema.safeParse({
          ...VALID_BASE,
          contextNote: "a".repeat(OUTREACH_CONTEXT_NOTE_MAX_LEN + 1),
        }).success,
      ).toBe(false);
    });

    it("rejects non-boolean includeImprovements", () => {
      expect(
        generateOutreachMessageSchema.safeParse({
          ...VALID_BASE,
          includeImprovements: "yes",
        }).success,
      ).toBe(false);
    });

    it("rejects missing channel", () => {
      const { channel: omittedChannel, ...rest } = VALID_BASE;
      void omittedChannel;
      expect(generateOutreachMessageSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects missing promptKey", () => {
      const { promptKey: omittedPromptKey, ...rest } = VALID_BASE;
      void omittedPromptKey;
      expect(generateOutreachMessageSchema.safeParse(rest).success).toBe(false);
    });
  });
});
