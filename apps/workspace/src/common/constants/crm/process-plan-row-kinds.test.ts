import { describe, expect, it } from "vitest";

import { ProcessPlanRowKind } from "@/common/constants/crm/process-plan-row-kinds";

describe("ProcessPlanRowKind", () => {
  it("lists every value exactly once", () => {
    const values = Object.values(ProcessPlanRowKind);

    expect(values).toEqual(["custom_step", "feedback_round"]);
    expect(new Set(values).size).toBe(values.length);
  });
});
