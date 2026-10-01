import { describe, expect, it } from "vitest";

import {
  crmFeedbackItemResultEndpoint,
  crmFeedbackRoundEndpoint,
  crmFeedbackRoundReadEndpoint,
  crmFeedbackRoundStatusEndpoint,
  crmQuestionnaireBlockDuplicateEndpoint,
  crmQuestionnaireBlockEndpoint,
  crmQuestionnaireBlockFieldsEndpoint,
  crmQuestionnaireFieldEndpoint,
  crmQuestionnaireFieldMoveEndpoint,
  crmQuestionnaireTemplateEndpoint,
  crmProjectFeedbackRoundsEndpoint,
} from "./crm-api-endpoints";

describe("crm feedback round endpoints", () => {
  it("builds the round list below the project and the detail below the round api", () => {
    expect(crmProjectFeedbackRoundsEndpoint("p-1")).toBe(
      "/api/workspace/crm/projects/p-1/feedback-rounds",
    );
    expect(crmFeedbackRoundEndpoint("r-1")).toBe(
      "/api/workspace/crm/feedback-rounds/r-1",
    );
  });

  it("encodes the ids", () => {
    expect(crmProjectFeedbackRoundsEndpoint("a/b")).toBe(
      "/api/workspace/crm/projects/a%2Fb/feedback-rounds",
    );
    expect(crmFeedbackRoundEndpoint("c d")).toBe(
      "/api/workspace/crm/feedback-rounds/c%20d",
    );
    expect(crmFeedbackItemResultEndpoint("e/f")).toBe(
      "/api/workspace/crm/feedback-round-items/e%2Ff/result",
    );
  });

  it("puts the status change below the round and the result below the item", () => {
    expect(crmFeedbackRoundStatusEndpoint("r-1")).toBe(
      "/api/workspace/crm/feedback-rounds/r-1/status",
    );
    expect(crmFeedbackItemResultEndpoint("i-1")).toBe(
      "/api/workspace/crm/feedback-round-items/i-1/result",
    );
  });

  it("puts the read stamp below the round", () => {
    expect(crmFeedbackRoundReadEndpoint("r/1")).toBe(
      "/api/workspace/crm/feedback-rounds/r%2F1/read",
    );
  });
});

describe("crm onboarding catalog endpoints", () => {
  it("nests duplicate and fields below the block and move below the field", () => {
    expect(crmQuestionnaireBlockEndpoint("b-1")).toBe(
      "/api/workspace/crm/questionnaire/blocks/b-1",
    );
    expect(crmQuestionnaireBlockDuplicateEndpoint("b-1")).toBe(
      "/api/workspace/crm/questionnaire/blocks/b-1/duplicate",
    );
    expect(crmQuestionnaireBlockFieldsEndpoint("b-1")).toBe(
      "/api/workspace/crm/questionnaire/blocks/b-1/fields",
    );
    expect(crmQuestionnaireFieldEndpoint("f-1")).toBe(
      "/api/workspace/crm/questionnaire/fields/f-1",
    );
    expect(crmQuestionnaireFieldMoveEndpoint("f-1")).toBe(
      "/api/workspace/crm/questionnaire/fields/f-1/move",
    );
    expect(crmQuestionnaireTemplateEndpoint("t/1")).toBe(
      "/api/workspace/crm/questionnaire/templates/t%2F1",
    );
  });
});
