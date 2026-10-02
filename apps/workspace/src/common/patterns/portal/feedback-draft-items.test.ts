import { describe, expect, it } from "vitest";
import { FeedbackItemKind } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { feedbackDraftItems } from "@/common/patterns/portal/feedback-draft-items";

const FILE: FileAttachmentDto = {
  id: "file-1",
  displayName: "hero.png",
  assetKind: AssetKind.Image,
  source: FileSource.Upload,
  extension: "png",
  sizeBytes: 1200,
  url: null,
  note: null,
  createdAt: "2026-09-30T08:00:00.000Z",
};

const ROUND: PortalFeedbackRoundDto = {
  id: "round-1",
  roundNumber: 1,
  status: FeedbackRoundStatus.Open,
  previewUrl: null,
  handoverNote: null,
  dueOn: null,
  areaOptions: ["Home"],
  draftUpdatedAt: null,
  draftUpdatedByName: null,
  submittedAt: null,
  customerNotice: null,
  completedAt: null,
  approvedAt: null,
  items: [
    {
      id: "item-1",
      position: 0,
      areaLabel: "Home",
      kind: FeedbackItemKind.Bug,
      body: "Hero too dark",
      result: null,
      resultNote: null,
      attachments: [FILE],
    },
  ],
  version: 4,
};

describe("feedbackDraftItems", () => {
  it("reads the items of a round with their files", () => {
    expect(feedbackDraftItems.fromRound(ROUND)).toEqual([
      {
        id: "item-1",
        areaLabel: "Home",
        kind: FeedbackItemKind.Bug,
        body: "Hero too dark",
        attachments: [FILE],
      },
    ]);
  });

  it("sends the draft fields without files", () => {
    expect(
      feedbackDraftItems.toRequestItems(feedbackDraftItems.fromRound(ROUND)),
    ).toEqual([
      {
        id: "item-1",
        areaLabel: "Home",
        kind: FeedbackItemKind.Bug,
        body: "Hero too dark",
      },
    ]);
  });

  it("joins the own texts into paragraphs for copying", () => {
    expect(
      feedbackDraftItems.toPlainText([
        {
          id: "a",
          areaLabel: null,
          kind: null,
          body: " One ",
          attachments: [],
        },
        { id: "b", areaLabel: null, kind: null, body: "  ", attachments: [] },
        { id: "c", areaLabel: null, kind: null, body: "Two", attachments: [] },
      ]),
    ).toBe("One\n\nTwo");
  });
});
