import { describe, expect, it } from "vitest";

import { OnboardingStructureDialogKind } from "./onboarding-structure-dialog-kinds";

describe("OnboardingStructureDialogKind", () => {
  it("names the four dialogs once", () => {
    expect(Object.values(OnboardingStructureDialogKind).sort()).toEqual([
      "own",
      "picker",
      "remove",
      "template",
    ]);
  });
});
