import { describe, expect, it } from "vitest";
import { FEEDBACK_ITEM_KIND_VALUES } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FEEDBACK_ITEM_KIND_ICONS } from "./feedback-item-kind-icons";

describe("FEEDBACK_ITEM_KIND_ICONS", () => {
  it("covers every item kind exactly once", () => {
    expect(Object.keys(FEEDBACK_ITEM_KIND_ICONS)).toEqual([
      ...FEEDBACK_ITEM_KIND_VALUES,
    ]);
  });
});
