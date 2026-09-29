import { describe, expect, it, vi } from "vitest";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { feedbackRoundMappingService } from "@/server/workspace/crm/services/feedback/feedback-round-mapping-service";
import {
  ITEM_ID,
  loadedItem,
  ROUND_ID,
  roundRow,
} from "../../../shared/services/feedback/feedback-round-fixtures";

vi.mock("server-only", () => ({}));

describe("feedbackRoundMappingService.toDto", () => {
  it("maps every round column and keeps nullable ones null", () => {
    expect(feedbackRoundMappingService.toDto(roundRow(), [])).toEqual({
      id: ROUND_ID,
      projectId: "22222222-2222-4222-8222-222222222222",
      customerId: "11111111-1111-4111-8111-111111111111",
      roundNumber: 1,
      status: FeedbackRoundStatus.Open,
      previewUrl: null,
      handoverNote: null,
      dueOn: null,
      areaOptions: [],
      handedOverByMemberId: "66666666-6666-4666-8666-666666666666",
      handedOverAt: "2026-09-01T08:00:00.000Z",
      draftUpdatedAt: null,
      submittedAt: null,
      submittedByPortalMembershipId: null,
      customerNotice: null,
      startedAt: null,
      completedAt: null,
      completedByMemberId: null,
      approvedAt: null,
      approvedByPortalMembershipId: null,
      readAt: null,
      items: [],
      version: 1,
      createdAt: "2026-09-01T08:00:00.000Z",
      updatedAt: "2026-09-01T08:00:00.000Z",
    });
  });

  it("maps items with the internal result and attachments", () => {
    const [item] = feedbackRoundMappingService.toDto(roundRow(), [
      loadedItem(),
    ]).items;
    expect(item).toEqual({
      id: ITEM_ID,
      position: 0,
      areaLabel: "Startseite",
      kind: "bug",
      body: "<b>Logo</b> 🙂",
      createdByPortalMembershipId: "77777777-7777-4777-8777-777777777777",
      result: "not_implemented",
      resultNote: "Kommt in Phase 2",
      resultSetByMemberId: "66666666-6666-4666-8666-666666666666",
      resultSetAt: "2026-09-05T10:00:00.000Z",
      attachments: loadedItem().attachments,
      version: 2,
    });
  });
});

describe("feedbackRoundMappingService.toSummaryDto", () => {
  it("counts a submitted round nobody opened as unread", () => {
    const submittedAt = new Date("2026-09-03T09:00:00.000Z");
    expect(
      feedbackRoundMappingService.toSummaryDto(
        roundRow({
          status: FeedbackRoundStatus.Submitted,
          submitted_at: submittedAt,
          due_on: "2026-09-10",
        }),
        3,
      ),
    ).toEqual({
      id: ROUND_ID,
      roundNumber: 1,
      status: FeedbackRoundStatus.Submitted,
      handedOverAt: "2026-09-01T08:00:00.000Z",
      dueOn: "2026-09-10",
      submittedAt: "2026-09-03T09:00:00.000Z",
      completedAt: null,
      approvedAt: null,
      itemCount: 3,
      unread: true,
    });
  });

  it("is read once a member opened it and never unread while open", () => {
    expect(
      feedbackRoundMappingService.toSummaryDto(
        roundRow({
          status: FeedbackRoundStatus.Submitted,
          submitted_at: new Date(),
          read_at: new Date(),
        }),
        0,
      ).unread,
    ).toBe(false);
    expect(feedbackRoundMappingService.toSummaryDto(roundRow(), 0).unread).toBe(
      false,
    );
  });
});
