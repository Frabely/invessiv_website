import { describe, expect, it } from "vitest";

import { ProcessPlanMoveDirection } from "@/common/constants/crm/process-plan-move-directions";

describe("ProcessPlanMoveDirection", () => {
  it("lists every value exactly once", () => {
    const values = Object.values(ProcessPlanMoveDirection);

    expect(values).toEqual(["up", "down"]);
    expect(new Set(values).size).toBe(values.length);
  });
});
