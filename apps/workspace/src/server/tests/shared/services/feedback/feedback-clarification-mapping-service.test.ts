import { describe, expect, it, vi } from "vitest";
import { feedbackClarificationMappingService as mapping } from "@/server/shared/services/feedback/feedback-clarification-mapping-service";
import { clarificationRow } from "./feedback-round-fixtures";

vi.mock("server-only", () => ({}));
describe("feedback clarification mapping", () => {
  it("whitelists public fields and converts nullable timestamps", () => {
    const row = clarificationRow();
    expect(mapping.toPublicDto(row)).toEqual({
      id: row.id,
      status: row.status,
      question: row.question,
      requestedAt: row.requested_at.toISOString(),
      answer: null,
      answeredAt: null,
      closeNote: null,
      closedAt: null,
    });
    const now = new Date();
    expect(
      mapping.toPublicDto(
        clarificationRow({
          status: "answered",
          answer: "Home",
          answered_at: now,
        }),
      ),
    ).toMatchObject({ answer: "Home", answeredAt: now.toISOString() });
    expect(
      mapping.toPublicDto(
        clarificationRow({
          status: "closed",
          close_note: "Phone call",
          closed_at: now,
        }),
      ),
    ).toMatchObject({ closeNote: "Phone call", closedAt: now.toISOString() });
  });
  it("resolves internal names without exposing identifiers and falls back to null", () => {
    const row = clarificationRow({
      answered_by_portal_membership_id: "contact",
      closed_by_member_id: "closer",
    });
    const dto = mapping.toInternalDto(
      row,
      new Map([
        [row.requested_by_member_id, "Requesting member"],
        ["closer", "Closing member"],
      ]),
      new Map([["contact", "Customer"]]),
    );
    expect(dto).toEqual({
      ...mapping.toPublicDto(row),
      requestedByName: "Requesting member",
      answeredByName: "Customer",
      closedByName: "Closing member",
    });
    expect(mapping.toInternalDto(row, new Map(), new Map())).toMatchObject({
      requestedByName: null,
      answeredByName: null,
      closedByName: null,
    });
    expect(
      mapping.toInternalDto(clarificationRow(), new Map(), new Map()),
    ).toMatchObject({ answeredByName: null, closedByName: null });
  });
});
