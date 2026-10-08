import { describe, expect, it } from "vitest";

import {
  decodeTimeEntryCursor,
  encodeTimeEntryCursor,
} from "@invessiv/common/patterns/crm/hours/time-entry-cursor";

const CURSOR = {
  performedOn: "2026-10-08",
  createdAt: "2026-10-08T09:15:30.123Z",
  id: "33333333-3333-4333-8333-333333333333",
};

describe("time entry cursor", () => {
  it("survives a round trip", () => {
    expect(decodeTimeEntryCursor(encodeTimeEntryCursor(CURSOR))).toEqual(
      CURSOR,
    );
  });

  it.each([
    "",
    "2026-10-08",
    "2026-10-08~2026-10-08T09:15:30.123Z",
    "2026-10-08~2026-10-08T09:15:30Z~33333333-3333-4333-8333-333333333333",
    "2026-10-08~2026-10-08T09:15:30.123Z~not-a-uuid",
    "2026-10-08~2026-10-08T09:15:30.123Z~33333333-3333-4333-8333-333333333333~x",
    "x'; drop table tasks; --",
  ])("rejects %s", (value) => {
    expect(decodeTimeEntryCursor(value)).toBeNull();
  });
});
