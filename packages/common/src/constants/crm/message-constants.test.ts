import { describe, expect, it } from "vitest";
import {
  MESSAGE_ATTACHMENTS_MAX,
  MESSAGE_BODY_MAX_LENGTH,
  MESSAGE_PAGE_SIZE,
  PORTAL_MESSAGE_RATE_WINDOW_SECONDS,
  PORTAL_MESSAGES_PER_HOUR,
} from "./message-limits";
import {
  MESSAGE_SENDER_SIDE_VALUES,
  MESSAGE_TYPE_VALUES,
  MessageSenderSide,
  MessageType,
} from "./message-types";
import {
  SYSTEM_MESSAGE_KEY_VALUES,
  SystemMessageKey,
  SystemMessageParam,
} from "./system-message-keys";

describe("message constants", () => {
  it("exposes the exact message types and sender sides without duplicates", () => {
    expect(MessageType).toEqual({ Text: "text", System: "system" });
    expect(MESSAGE_TYPE_VALUES).toEqual(Object.values(MessageType));
    expect(new Set(MESSAGE_TYPE_VALUES).size).toBe(MESSAGE_TYPE_VALUES.length);
    expect(MessageSenderSide).toEqual({
      Internal: "internal",
      Customer: "customer",
      System: "system",
    });
    expect(MESSAGE_SENDER_SIDE_VALUES).toEqual(
      Object.values(MessageSenderSide),
    );
    expect(new Set(MESSAGE_SENDER_SIDE_VALUES).size).toBe(
      MESSAGE_SENDER_SIDE_VALUES.length,
    );
  });

  it("keeps validation, pagination and portal throttling limits explicit", () => {
    expect({
      MESSAGE_ATTACHMENTS_MAX,
      MESSAGE_BODY_MAX_LENGTH,
      MESSAGE_PAGE_SIZE,
      PORTAL_MESSAGES_PER_HOUR,
      PORTAL_MESSAGE_RATE_WINDOW_SECONDS,
    }).toEqual({
      MESSAGE_ATTACHMENTS_MAX: 10,
      MESSAGE_BODY_MAX_LENGTH: 10_000,
      MESSAGE_PAGE_SIZE: 50,
      PORTAL_MESSAGES_PER_HOUR: 30,
      PORTAL_MESSAGE_RATE_WINDOW_SECONDS: 3600,
    });
  });
});

describe("system message constants", () => {
  it("exposes the exact event keys and parameters without duplicates", () => {
    expect(SystemMessageKey).toEqual({
      ProjectPhaseChanged: "projectPhaseChanged",
      FeedbackRoundHandedOver: "feedbackRoundHandedOver",
      FeedbackRoundSubmitted: "feedbackRoundSubmitted",
      FeedbackRoundDiscussionRequested: "feedbackRoundDiscussionRequested",
      FeedbackRoundReturned: "feedbackRoundReturned",
      FeedbackRoundCompleted: "feedbackRoundCompleted",
      FeedbackApproved: "feedbackApproved",
      OnboardingSubmitted: "onboardingSubmitted",
      OnboardingReleased: "onboardingReleased",
      OnboardingChangesRequested: "onboardingChangesRequested",
      OnboardingCompleted: "onboardingCompleted",
    });
    expect(SYSTEM_MESSAGE_KEY_VALUES).toEqual(Object.values(SystemMessageKey));
    expect(SystemMessageParam).toEqual({
      ProjectTitle: "projectTitle",
      Phase: "phase",
      RoundNumber: "roundNumber",
      BlockTitles: "blockTitles",
    });
    const params = Object.values(SystemMessageParam);
    expect(new Set(params).size).toBe(params.length);
  });
});
