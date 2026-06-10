import { describe, expect, it, vi } from "vitest";
import { GENERATOR_TEMPLATES } from "@/common/constants/generator/generator-templates";
import { LinkedInPostGeneratorErrorCode } from "@/common/constants/generator";
import type { LinkedInPostGeneratorRequestDto } from "@/common/contracts/generator/linkedin-post-generator-request";
import {
  LinkedInPostGenerationError,
  linkedinPostOpenaiAdapterService,
} from "./linkedin-post-openai-adapter-service";

vi.mock("server-only", () => ({}));

const INSIGHT_TEMPLATE = GENERATOR_TEMPLATES[0];

const GENERATOR_REQUEST: LinkedInPostGeneratorRequestDto = {
  colorPairId: "auto",
  company: "",
  consent: true,
  displayName: "Max Mustermann",
  email: "max@example.com",
  expertise: "Consulting",
  locale: "en",
  tone: "sachlich",
  topic: "Pricing conversations",
};

const VALID_GENERATED_CONTENT = {
  bodyVariant: "insight",
  bullets: null,
  caption: {
    body: "A short standalone caption paragraph.",
    hashtags: ["B2B", "Pricing", "LinkedIn"],
  },
  headlineHtml: "Sharp <em>pricing</em>",
  headlinePlain: "Sharp pricing",
  highlight: "One focal line that sharpens the point.",
  insight: "A concise observation about pricing.",
  kicker: "Pricing",
};

function createResponsesClient(outputText: string) {
  return {
    create: vi.fn().mockResolvedValue({ output_text: outputText }),
  };
}

describe("linkedinPostOpenaiAdapterService.callOpenAI", () => {
  it("returns validated content for a successful response", async () => {
    const client = createResponsesClient(
      JSON.stringify(VALID_GENERATED_CONTENT),
    );

    const content = await linkedinPostOpenaiAdapterService.callOpenAI(
      client,
      GENERATOR_REQUEST,
      "gpt-test",
      INSIGHT_TEMPLATE,
    );

    expect(content.headlinePlain).toBe("Sharp pricing");
    expect(content.caption.hashtags.at(-1)).toBe("LinkedIn");
    expect(client.create).toHaveBeenCalledTimes(1);
  });

  it("reuses the same adapted content schema across requests", async () => {
    const firstClient = createResponsesClient(
      JSON.stringify(VALID_GENERATED_CONTENT),
    );
    const secondClient = createResponsesClient(
      JSON.stringify(VALID_GENERATED_CONTENT),
    );

    await linkedinPostOpenaiAdapterService.callOpenAI(
      firstClient,
      GENERATOR_REQUEST,
      "gpt-test",
      INSIGHT_TEMPLATE,
    );
    await linkedinPostOpenaiAdapterService.callOpenAI(
      secondClient,
      GENERATOR_REQUEST,
      "gpt-test",
      INSIGHT_TEMPLATE,
    );

    const firstSchema =
      firstClient.create.mock.calls[0]?.[0]?.text?.format?.schema;
    const secondSchema =
      secondClient.create.mock.calls[0]?.[0]?.text?.format?.schema;
    expect(firstSchema).toBeTruthy();
    expect(secondSchema).toBe(firstSchema);
  });

  it("maps schema rejections from OpenAI to openai_schema_error", async () => {
    const client = {
      create: vi
        .fn()
        .mockRejectedValue(new Error("Invalid schema for response_format")),
    };

    await expect(
      linkedinPostOpenaiAdapterService.callOpenAI(
        client,
        GENERATOR_REQUEST,
        "gpt-test",
        INSIGHT_TEMPLATE,
      ),
    ).rejects.toMatchObject({
      code: LinkedInPostGeneratorErrorCode.OpenAiSchemaError,
      name: "LinkedInPostGenerationError",
    });
  });

  it("keeps quality-gate failures visible as openai_invalid_content", async () => {
    const client = createResponsesClient(
      JSON.stringify({ ...VALID_GENERATED_CONTENT, headlinePlain: "" }),
    );

    const failure = linkedinPostOpenaiAdapterService.callOpenAI(
      client,
      GENERATOR_REQUEST,
      "gpt-test",
      INSIGHT_TEMPLATE,
    );

    await expect(failure).rejects.toBeInstanceOf(LinkedInPostGenerationError);
    await expect(failure).rejects.toMatchObject({
      code: LinkedInPostGeneratorErrorCode.OpenAiInvalidContent,
      stage: "openai_quality_gate",
    });
  });

  it("keeps schema adaptation failures visible as generator schema errors", async () => {
    vi.resetModules();
    vi.doMock(
      "../../../project-skills/linkedin-post-generator/references/content-schema.json",
      () => ({ default: "not-a-json-object" }),
    );

    const freshAdapterModule =
      await import("./linkedin-post-openai-adapter-service");
    const client = createResponsesClient(
      JSON.stringify(VALID_GENERATED_CONTENT),
    );

    await expect(
      freshAdapterModule.linkedinPostOpenaiAdapterService.callOpenAI(
        client,
        GENERATOR_REQUEST,
        "gpt-test",
        INSIGHT_TEMPLATE,
      ),
    ).rejects.toMatchObject({
      code: LinkedInPostGeneratorErrorCode.GeneratorSchemaInvalid,
      name: "LinkedInPostGenerationError",
      stage: "schema_adapter",
    });

    vi.doUnmock(
      "../../../project-skills/linkedin-post-generator/references/content-schema.json",
    );
  });
});
