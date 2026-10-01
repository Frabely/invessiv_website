import { describe, expect, it } from "vitest";

import {
  portalConversationEndpoint,
  portalConversationMessagesEndpoint,
  portalConversationReadEndpoint,
  portalFileCancelEndpoint,
  portalFileCompleteEndpoint,
  portalFileDownloadEndpoint,
  portalFileDownloadUrlEndpoint,
  portalFileLinksEndpoint,
  portalFilesArchiveEndpoint,
  portalFilesEndpoint,
  portalOnboardingAnswersEndpoint,
  portalOnboardingSubmitEndpoint,
  portalFileUploadsEndpoint,
  portalFeedbackApproveEndpoint,
  portalFeedbackDraftEndpoint,
  portalFeedbackItemFileEndpoint,
  portalFeedbackItemFilesEndpoint,
  portalFeedbackSubmitEndpoint,
  portalProjectFeedbackEndpoint,
  portalTaskCompleteEndpoint,
} from "./portal-api-endpoints";

describe("portal feedback endpoints", () => {
  it("builds the project feedback page path", () => {
    expect(portalProjectFeedbackEndpoint("c-1", "p-1")).toBe(
      "/api/portal/c-1/projects/p-1/feedback",
    );
  });

  it("builds the round command paths", () => {
    expect(portalFeedbackDraftEndpoint("c-1", "r-1")).toBe(
      "/api/portal/c-1/feedback-rounds/r-1/draft",
    );
    expect(portalFeedbackSubmitEndpoint("c-1", "r-1")).toBe(
      "/api/portal/c-1/feedback-rounds/r-1/submit",
    );
    expect(portalFeedbackApproveEndpoint("c-1", "r-1")).toBe(
      "/api/portal/c-1/feedback-rounds/r-1/approve",
    );
  });

  it("builds the item file paths", () => {
    expect(portalFeedbackItemFilesEndpoint("c-1", "r-1", "i-1")).toBe(
      "/api/portal/c-1/feedback-rounds/r-1/items/i-1/files",
    );
    expect(portalFeedbackItemFileEndpoint("c-1", "r-1", "i-1", "f-1")).toBe(
      "/api/portal/c-1/feedback-rounds/r-1/items/i-1/files/f-1",
    );
  });

  it("encodes every path segment", () => {
    expect(portalProjectFeedbackEndpoint("a/b", "c d")).toBe(
      "/api/portal/a%2Fb/projects/c%20d/feedback",
    );
    expect(portalFeedbackItemFileEndpoint("a/b", "r/1", "i 1", "f?1")).toBe(
      "/api/portal/a%2Fb/feedback-rounds/r%2F1/items/i%201/files/f%3F1",
    );
  });
});

describe("portalTaskCompleteEndpoint", () => {
  it("builds the completion path below the portal api", () => {
    expect(portalTaskCompleteEndpoint("customer-1", "task-1")).toBe(
      "/api/portal/customer-1/tasks/task-1/complete",
    );
  });

  it("encodes both path segments", () => {
    expect(portalTaskCompleteEndpoint("a/b", "c d")).toBe(
      "/api/portal/a%2Fb/tasks/c%20d/complete",
    );
  });
});

describe("portal conversation endpoints", () => {
  it("builds the conversation paths below the encoded customer", () => {
    expect(portalConversationEndpoint("a/b")).toBe(
      "/api/portal/a%2Fb/conversation",
    );
    expect(portalConversationMessagesEndpoint("c-1")).toBe(
      "/api/portal/c-1/conversation/messages",
    );
    expect(portalConversationReadEndpoint("c-1")).toBe(
      "/api/portal/c-1/conversation/read",
    );
  });
});

describe("portal file endpoints", () => {
  it("builds every file path below the encoded customer", () => {
    expect(portalFilesEndpoint("a/b")).toBe("/api/portal/a%2Fb/files");
    expect(portalFileUploadsEndpoint("c-1")).toBe(
      "/api/portal/c-1/files/uploads",
    );
    expect(portalFileLinksEndpoint("c-1")).toBe("/api/portal/c-1/files/links");
    expect(portalFilesArchiveEndpoint("c-1")).toBe(
      "/api/portal/c-1/files/archive",
    );
    expect(portalFileCompleteEndpoint("c-1", "f 1")).toBe(
      "/api/portal/c-1/files/f%201/complete",
    );
    expect(portalFileCancelEndpoint("c-1", "f 1")).toBe(
      "/api/portal/c-1/files/f%201/cancel",
    );
    expect(portalFileDownloadUrlEndpoint("c-1", "f-1")).toBe(
      "/api/portal/c-1/files/f-1/download-url",
    );
    expect(portalFileDownloadEndpoint("c-1", "f-1")).toBe(
      "/api/portal/c-1/files/f-1/download",
    );
  });
});

describe("portal onboarding endpoints", () => {
  it("builds the answer and submit paths below the encoded form", () => {
    expect(portalOnboardingAnswersEndpoint("a/b", "f 1")).toBe(
      "/api/portal/a%2Fb/onboarding/f%201/answers",
    );
    expect(portalOnboardingSubmitEndpoint("c-1", "f-1")).toBe(
      "/api/portal/c-1/onboarding/f-1/submit",
    );
  });
});
