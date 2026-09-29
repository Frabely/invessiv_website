import { describe, expect, it } from "vitest";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { portalFeedbackSchemas } from "@/server/portal/services/feedback/portal-feedback-schemas";

const item = (index: number, body = "Text") => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
  areaLabel: null,
  kind: null,
  body,
});

describe("portalFeedbackSchemas.draft", () => {
  it("accepts the item limit and rejects one more", () => {
    const items = Array.from(
      { length: FEEDBACK_LIMITS.itemsPerRound + 1 },
      (_, i) => item(i),
    );
    expect(
      portalFeedbackSchemas.draft.safeParse({
        version: 1,
        items: items.slice(0, -1),
      }).success,
    ).toBe(true);
    expect(
      portalFeedbackSchemas.draft.safeParse({ version: 1, items }).success,
    ).toBe(false);
  });

  it("counts characters like Postgres, so emoji are one character", () => {
    const limit = FEEDBACK_LIMITS.itemBodyMaxLength;
    const accept = (body: string) =>
      portalFeedbackSchemas.draft.safeParse({
        version: 1,
        items: [item(1, body)],
      }).success;
    expect(accept("ä".repeat(limit))).toBe(true);
    expect(accept("🙂".repeat(limit))).toBe(true);
    expect(accept("a".repeat(limit + 1))).toBe(false);
  });

  it("keeps the body raw, markup and whitespace included", () => {
    const body = "  <script>alert(1)</script> **fett** ü 🙂  ";
    const parsed = portalFeedbackSchemas.draft.parse({
      version: 1,
      items: [item(1, body)],
    });
    expect(parsed.items[0].body).toBe(body);
  });

  it("rejects duplicate item ids and unknown fields", () => {
    expect(
      portalFeedbackSchemas.draft.safeParse({
        version: 1,
        items: [item(1), item(1)],
      }).success,
    ).toBe(false);
    expect(
      portalFeedbackSchemas.draft.safeParse({
        version: 1,
        items: [{ ...item(1), result: "implemented" }],
      }).success,
    ).toBe(false);
  });
});
