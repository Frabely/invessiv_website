import { describe, expect, it } from "vitest";

import { ProcessTrackItemKind } from "@invessiv/common/constants/crm/process-track-item-kinds";

describe("ProcessTrackItemKind", () => {
  it("lists every value exactly once", () => {
    const values = Object.values(ProcessTrackItemKind);

    expect(values).toEqual(["custom", "feedback_round"]);
    expect(new Set(values).size).toBe(values.length);
  });
});
