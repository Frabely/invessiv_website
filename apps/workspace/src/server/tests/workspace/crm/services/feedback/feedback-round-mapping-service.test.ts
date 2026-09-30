import { describe, expect, it, vi } from "vitest";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { feedbackRoundMappingService } from "@/server/workspace/crm/services/feedback/feedback-round-mapping-service";
import {
  ITEM_ID,
  loadedItem,
  ROUND_ID,
  roundRow,
} from "../../../../shared/services/feedback/feedback-round-fixtures";

vi.mock("server-only", () => ({}));

describe("feedbackRoundMappingService.toDto", () => {
  it("maps every round column and keeps nullable ones null", () => {
    expect(
      feedbackRoundMappingService.toDto(roundRow(), [], new Map()),
    ).toEqual({
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
      draftUpdatedByName: null,
      submittedAt: null,
      submittedByPortalMembershipId: null,
      submittedByName: null,
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

  it("names the contacts behind the draft and the submission", () => {
    const membershipId = "99999999-9999-4999-8999-999999999999";
    const dto = feedbackRoundMappingService.toDto(
      roundRow({
        status: FeedbackRoundStatus.Submitted,
        submitted_at: new Date(),
        submitted_by_portal_membership_id: membershipId,
        draft_updated_by_portal_membership_id: membershipId,
      }),
      [],
      new Map([[membershipId, "Anna Berger"]]),
    );
    expect(dto).toMatchObject({
      submittedByName: "Anna Berger",
      draftUpdatedByName: "Anna Berger",
    });
  });

  it("maps items with the internal result and attachments", () => {
    const [item] = feedbackRoundMappingService.toDto(
      roundRow(),
      [loadedItem()],
      new Map(),
    ).items;
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
  it("maps the unread state computed by the round query", () => {
    const submittedAt = new Date("2026-09-03T09:00:00.000Z");
    expect(
      feedbackRoundMappingService.toSummaryDto(
        roundRow({
          status: FeedbackRoundStatus.Submitted,
          submitted_at: submittedAt,
          due_on: "2026-09-10",
        }),
        3,
        true,
      ),
    ).toEqual({
      id: ROUND_ID,
      roundNumber: 1,
      status: FeedbackRoundStatus.Submitted,
      handedOverAt: "2026-09-01T08:00:00.000Z",
      previewUrl: null,
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
        false,
      ).unread,
    ).toBe(false);
    expect(
      feedbackRoundMappingService.toSummaryDto(roundRow(), 0, false).unread,
    ).toBe(false);
  });
});

describe("feedbackRoundMappingService.toInboxItemDto", () => {
  const row = {
    customerDisplayName: "Nordlicht GmbH",
    projectTitle: "Relaunch",
    itemCount: 3,
    fileCount: 2,
    unread: true,
    excerpt: "Logo größer",
  };

  it("maps a submitted round with its card context", () => {
    expect(
      feedbackRoundMappingService.toInboxItemDto({
        ...row,
        round: roundRow({
          status: FeedbackRoundStatus.Submitted,
          round_number: 2,
          submitted_at: new Date("2026-09-03T09:00:00.000Z"),
          due_on: "2026-09-10",
        }),
      }),
    ).toEqual({
      id: ROUND_ID,
      roundNumber: 2,
      status: FeedbackRoundStatus.Submitted,
      customerId: "11111111-1111-4111-8111-111111111111",
      customerDisplayName: "Nordlicht GmbH",
      projectId: "22222222-2222-4222-8222-222222222222",
      projectTitle: "Relaunch",
      submittedAt: "2026-09-03T09:00:00.000Z",
      dueOn: "2026-09-10",
      itemCount: 3,
      fileCount: 2,
      excerpt: "Logo größer",
      unread: true,
    });
  });

  it("is no longer new once opened or in progress", () => {
    const submitted = new Date();
    expect(
      feedbackRoundMappingService.toInboxItemDto({
        ...row,
        unread: false,
        round: roundRow({
          status: FeedbackRoundStatus.InProgress,
          submitted_at: submitted,
          started_at: submitted,
        }),
      }).unread,
    ).toBe(false);
  });

  it("rejects a round outside the internal queue", () => {
    expect(() =>
      feedbackRoundMappingService.toInboxItemDto({ ...row, round: roundRow() }),
    ).toThrow("Feedback inbox row outside the internal queue");
  });
});
