import { describe, expect, it } from "vitest";
import { OutreachProvider } from "./outreach-provider";

describe("OutreachProvider", () => {
  it("keeps the outreach provider values stable", () => {
    expect(OutreachProvider).toEqual({
      OpenAi: "openai",
    });
  });
});
