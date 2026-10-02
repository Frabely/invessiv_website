import { describe, expect, it } from "vitest";

import { VersionedMutationOutcomeKind } from "./versioned-mutation-outcome-kinds";

describe("VersionedMutationOutcomeKind", () => {
  it("names exactly the three ways a write ends", () => {
    expect(Object.values(VersionedMutationOutcomeKind).sort()).toEqual([
      "conflict",
      "failure",
      "saved",
    ]);
  });
});
