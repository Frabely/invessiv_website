import { describe, expect, it } from "vitest";

import { EXTRA_FEEDBACK_ROUND_BLOCKER_VALUES } from "@invessiv/common/constants/crm/extra-feedback-round-blockers";
import {
  AUTOMATED_LINE_ITEM_KIND_VALUES,
  LINE_ITEM_KIND_VALUES,
  LineItemKind,
} from "@invessiv/common/constants/crm/line-item-kinds";
import {
  LINE_ITEM_PROJECT_MODE_VALUES,
  LineItemProjectMode,
} from "@invessiv/common/constants/crm/line-item-project-modes";

describe("line item kinds", () => {
  it("lists every kind exactly once", () => {
    expect(LINE_ITEM_KIND_VALUES).toEqual([
      "standard",
      "hours",
      "feedback_round",
    ]);
    expect(LINE_ITEM_KIND_VALUES).toEqual(Object.values(LineItemKind));
    expect(new Set(LINE_ITEM_KIND_VALUES).size).toBe(
      LINE_ITEM_KIND_VALUES.length,
    );
  });

  it("marks the kinds whose assignment has an effect beyond the line item", () => {
    expect(AUTOMATED_LINE_ITEM_KIND_VALUES).toEqual([
      "hours",
      "feedback_round",
    ]);
  });

  it("lists every project mode exactly once", () => {
    expect(LINE_ITEM_PROJECT_MODE_VALUES).toEqual([
      "existing_project",
      "new_project",
    ]);
    expect(LINE_ITEM_PROJECT_MODE_VALUES).toEqual(
      Object.values(LineItemProjectMode),
    );
  });

  it("lists every extra round blocker exactly once", () => {
    expect(EXTRA_FEEDBACK_ROUND_BLOCKER_VALUES).toEqual([
      "project_approved",
      "limit_reached",
    ]);
    expect(new Set(EXTRA_FEEDBACK_ROUND_BLOCKER_VALUES).size).toBe(
      EXTRA_FEEDBACK_ROUND_BLOCKER_VALUES.length,
    );
  });
});
