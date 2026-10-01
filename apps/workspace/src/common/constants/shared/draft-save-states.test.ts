import { describe, expect, it } from "vitest";

import {
  DRAFT_SAVE_STATE_VALUES,
  DraftSaveState,
} from "@/common/constants/shared/draft-save-states";

describe("DraftSaveState", () => {
  it("contains the exact states without duplicates", () => {
    expect(DRAFT_SAVE_STATE_VALUES).toEqual([
      "idle",
      "unsaved",
      "saving",
      "saved",
      "failed",
      "conflict",
    ]);
    expect([...DRAFT_SAVE_STATE_VALUES]).toEqual(Object.values(DraftSaveState));
  });
});
