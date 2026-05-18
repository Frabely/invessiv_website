import { describe, expect, it } from "vitest";
import { OutreachOpenAi } from "./outreach-openai";

describe("OutreachOpenAi", () => {
  it("keeps the OpenAI default model stable", () => {
    expect(OutreachOpenAi).toEqual({
      DefaultModel: "gpt-4.1-mini",
    });
  });
});
