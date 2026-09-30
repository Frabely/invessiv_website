import { FeedbackItemKind } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import type {
  FeedbackRoundRow,
  LoadedFeedbackItem,
} from "@/server/shared/services/feedback/feedback-service-types";

export const ROUND_ID = "44444444-4444-4444-8444-444444444444";
export const ITEM_ID = "55555555-5555-4555-8555-555555555555";

export function roundRow(
  overrides: Partial<FeedbackRoundRow> = {},
): FeedbackRoundRow {
  return {
    id: ROUND_ID,
    project_id: "22222222-2222-4222-8222-222222222222",
    customer_id: "11111111-1111-4111-8111-111111111111",
    round_number: 1,
    status: FeedbackRoundStatus.Open,
    preview_url: null,
    handover_note: null,
    due_on: null,
    area_options: [],
    handed_over_by_member_id: "66666666-6666-4666-8666-666666666666",
    handed_over_at: new Date("2026-09-01T08:00:00.000Z"),
    draft_updated_at: null,
    draft_updated_by_portal_membership_id: null,
    submitted_at: null,
    submitted_by_portal_membership_id: null,
    customer_notice: null,
    started_at: null,
    completed_at: null,
    completed_by_member_id: null,
    approved_at: null,
    approved_by_portal_membership_id: null,
    read_at: null,
    version: 1,
    created_at: new Date("2026-09-01T08:00:00.000Z"),
    updated_at: new Date("2026-09-01T08:00:00.000Z"),
    ...overrides,
  };
}

export function loadedItem(): LoadedFeedbackItem {
  return {
    item: {
      id: ITEM_ID,
      round_id: ROUND_ID,
      position: 0,
      area_label: "Startseite",
      kind: FeedbackItemKind.Bug,
      body: "<b>Logo</b> 🙂",
      created_by_portal_membership_id: "77777777-7777-4777-8777-777777777777",
      result: FeedbackItemResult.NotImplemented,
      result_note: "Kommt in Phase 2",
      result_set_by_member_id: "66666666-6666-4666-8666-666666666666",
      result_set_at: new Date("2026-09-05T10:00:00.000Z"),
      version: 2,
      created_at: new Date("2026-09-02T08:00:00.000Z"),
      updated_at: new Date("2026-09-05T10:00:00.000Z"),
    },
    attachments: [
      {
        id: "88888888-8888-4888-8888-888888888888",
        displayName: "screen.png",
        assetKind: AssetKind.Image,
        source: FileSource.Upload,
        extension: "png",
        sizeBytes: 1024,
        url: null,
        note: null,
        createdAt: "2026-09-02T08:00:00.000Z",
      },
    ],
  };
}
