import { describe, expect, it } from "vitest";

import {
  STATUS_CHANGE_ORIGIN_VALUES,
  StatusChangeOrigin,
} from "@invessiv/common/constants/activity/status-change-origins";

describe("StatusChangeOrigin", () => {
  it("contains the exact supported values", () => {
    expect(STATUS_CHANGE_ORIGIN_VALUES).toEqual([
      "single_edit",
      "bulk_edit",
      "bulk_archive",
    ]);
    expect(STATUS_CHANGE_ORIGIN_VALUES).toEqual(
      Object.values(StatusChangeOrigin),
    );
  });

  it("has no duplicates", () => {
    expect(new Set(STATUS_CHANGE_ORIGIN_VALUES).size).toBe(
      STATUS_CHANGE_ORIGIN_VALUES.length,
    );
  });
});
