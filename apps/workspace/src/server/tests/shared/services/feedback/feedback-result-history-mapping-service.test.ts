import { describe, expect, it, vi } from "vitest";
import { FeedbackResultActorSide as A } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { FeedbackResultHistoryEventKind as K } from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";
import { feedbackResultHistoryMappingService } from "@/server/shared/services/feedback/feedback-result-history-mapping-service";
import type { FeedbackResultHistoryRow } from "@/server/shared/services/feedback/feedback-service-types";
import { loadedItem } from "./feedback-round-fixtures";

vi.mock("server-only", () => ({}));

function baselineRow(): FeedbackResultHistoryRow {
  const source = loadedItem().item;
  return {
    id: "entry",
    item_id: source.id,
    item_version: source.version,
    event_kind: K.Baseline,
    result: source.result,
    result_note: source.result_note,
    result_set_by_member_id: source.result_set_by_member_id,
    result_set_at: source.result_set_at,
    actor_side: A.Member,
    actor_member_id: source.result_set_by_member_id,
    actor_portal_membership_id: null,
    occurred_at: source.result_set_at!,
    created_at: new Date(),
    command_id: null,
    request_version: null,
  };
}

function portalResetRow(
  portalMembershipId: string | null,
): FeedbackResultHistoryRow {
  return {
    ...baselineRow(),
    event_kind: K.Reset,
    result: null,
    result_note: null,
    result_set_by_member_id: null,
    result_set_at: null,
    actor_side: A.PortalContact,
    actor_member_id: null,
    actor_portal_membership_id: portalMembershipId,
  };
}

describe("feedbackResultHistoryMappingService.toEntryDto", () => {
  it("maps every field without exposing author or command ids", () => {
    const row = baselineRow();
    expect(
      feedbackResultHistoryMappingService.toEntryDto(row, "Anna", new Map()),
    ).toEqual({
      id: "entry",
      kind: K.Baseline,
      itemVersion: row.item_version,
      result: row.result,
      resultNote: row.result_note,
      actorSide: A.Member,
      actorName: "Anna",
      occurredAt: row.occurred_at.toISOString(),
    });
  });

  it("keeps a member without a resolved name null", () => {
    expect(
      feedbackResultHistoryMappingService.toEntryDto(
        baselineRow(),
        null,
        new Map(),
      ).actorName,
    ).toBeNull();
  });

  it("names a contact from the loaded contact names", () => {
    expect(
      feedbackResultHistoryMappingService.toEntryDto(
        portalResetRow("contact"),
        null,
        new Map([["contact", "Customer"]]),
      ).actorName,
    ).toBe("Customer");
  });

  it("keeps a removed portal membership null", () => {
    expect(
      feedbackResultHistoryMappingService.toEntryDto(
        portalResetRow(null),
        null,
        new Map(),
      ).actorName,
    ).toBeNull();
  });
});
