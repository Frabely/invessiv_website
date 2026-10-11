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
    { performedOn: "2026-13-40" },
    { performedOn: "2026-02-29" },
    { performedOn: "2026-04-31" },
    { createdAt: "2026-10-08T25:15:30.123Z" },
    { createdAt: "2026-10-08T09:60:30.123Z" },
    { createdAt: "2026-02-29T09:15:30.123Z" },
  ])("rejects impossible calendar values: %j", (overrides) => {
    expect(
      decodeTimeEntryCursor(encodeTimeEntryCursor({ ...CURSOR, ...overrides })),
    ).toBeNull();
  });

  it("accepts a real leap day", () => {
    const leap = {
      ...CURSOR,
      performedOn: "2024-02-29",
      createdAt: "2024-02-29T00:00:00.000Z",
    };
    expect(decodeTimeEntryCursor(encodeTimeEntryCursor(leap))).toEqual(leap);
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
