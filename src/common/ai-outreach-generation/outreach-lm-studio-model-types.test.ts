import { describe, expect, it } from "vitest";
import { OutreachLmStudioModelType } from "./outreach-lm-studio-model-types";

describe("OutreachLmStudioModelType", () => {
  it("keeps the LM Studio model types stable", () => {
    expect(OutreachLmStudioModelType).toEqual({
      Llm: "llm",
      Embedding: "embedding",
    });
  });
});
