import { describe, expect, it } from "vitest";
import { OutreachLmStudio, OutreachOpenAi } from "./outreach-lm-studio";

describe("OutreachLmStudio", () => {
  it("keeps the LM Studio endpoints stable", () => {
    expect(OutreachLmStudio).toMatchObject({
      DefaultBaseUrl: "http://127.0.0.1:1234/v1",
      NativeApiBaseUrl: "http://127.0.0.1:1234/api/v1",
      ChatCompletionsEndpoint: "http://127.0.0.1:1234/v1/chat/completions",
      ModelsEndpoint: "http://127.0.0.1:1234/api/v1/models",
    });
  });

  it("keeps the OpenAI default model stable", () => {
    expect(OutreachOpenAi).toEqual({
      DefaultModel: "gpt-4.1-mini",
    });
  });
});
