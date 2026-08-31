import { describe, expect, it } from "vitest";

import { QNA_STAGE_PHASE } from "./qna-stage-phase";

describe("QNA_STAGE_PHASE", () => {
  it("keeps the scroll choreography phases stable", () => {
    expect(QNA_STAGE_PHASE).toEqual({
      Question: "question",
      Handover: "handover",
      Board: "board",
    });
  });
});
