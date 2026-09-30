import { describe, expect, it, vi } from "vitest";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { portalFeedbackMappingService } from "@/server/portal/services/feedback/portal-feedback-mapping-service";
import {
  ITEM_ID,
  loadedItem,
  ROUND_ID,
  roundRow,
} from "../../../shared/services/feedback/feedback-round-fixtures";

vi.mock("server-only", () => ({}));

describe("portalFeedbackMappingService.toRoundDto", () => {
  it("maps the customer fields and leaves internal actors out", () => {
    const dto = portalFeedbackMappingService.toRoundDto(
      roundRow({
        preview_url: "https://preview.example.com",
        handover_note: "Neue Startseite",
        due_on: "2026-09-10",
        area_options: ["Startseite"],
      }),
      [],
      new Map(),
    );
    expect(dto).toEqual({
      id: ROUND_ID,
      roundNumber: 1,
      status: FeedbackRoundStatus.Open,
      previewUrl: "https://preview.example.com",
      handoverNote: "Neue Startseite",
      dueOn: "2026-09-10",
      areaOptions: ["Startseite"],
      draftUpdatedAt: null,
      draftUpdatedByName: null,
      submittedAt: null,
      customerNotice: null,
      completedAt: null,
      approvedAt: null,
      items: [],
      version: 1,
    });
    expect(dto).not.toHaveProperty("handedOverByMemberId");
    expect(dto).not.toHaveProperty("readAt");
  });

  it("names the contact who saved the draft last", () => {
    const membershipId = "99999999-9999-4999-8999-999999999999";
    const dto = portalFeedbackMappingService.toRoundDto(
      roundRow({
        draft_updated_at: new Date("2026-09-03T09:00:00.000Z"),
        draft_updated_by_portal_membership_id: membershipId,
      }),
      [],
      new Map([[membershipId, "Anna Berger"]]),
    );
    expect(dto.draftUpdatedByName).toBe("Anna Berger");
  });

  it("hides results before the round is completed", () => {
    const [item] = portalFeedbackMappingService.toRoundDto(
      roundRow({
        status: FeedbackRoundStatus.InProgress,
        submitted_at: new Date(),
        started_at: new Date(),
      }),
      [loadedItem()],
      new Map(),
    ).items;
    expect(item).toEqual({
      id: ITEM_ID,
      position: 0,
      areaLabel: "Startseite",
      kind: "bug",
      body: "<b>Logo</b> 🙂",
      result: null,
      resultNote: null,
      attachments: loadedItem().attachments,
    });
  });

  it.each([FeedbackRoundStatus.Completed, FeedbackRoundStatus.Approved])(
    "shows results once the round is %s",
    (status) => {
      const [item] = portalFeedbackMappingService.toRoundDto(
        roundRow({ status }),
        [loadedItem()],
        new Map(),
      ).items;
      expect(item.result).toBe("not_implemented");
      expect(item.resultNote).toBe("Kommt in Phase 2");
    },
  );
});
