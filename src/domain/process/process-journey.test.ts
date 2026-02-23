import { describe, expect, it } from "vitest";

import { buildProcessJourneyPathD } from "./process-journey";

function makeCard(offsetTop: number, offsetHeight: number) {
  return { offsetTop, offsetHeight } as HTMLElement;
}

describe("buildProcessJourneyPathD", () => {
  it("builds the expected snake path across card gaps", () => {
    const cards = [makeCard(100, 200), makeCard(360, 200), makeCard(620, 200)];
    const container = { clientWidth: 1000, scrollHeight: 1000 } as HTMLElement;

    const d = buildProcessJourneyPathD(cards, container);

    expect(d).toBe(
      "M8 200 L 8 330 L 940 330 L 940 590 L 60 590 L 940 590 L 940 838 L 992 838",
    );
  });

  it("returns a fallback path when there are no cards", () => {
    const d = buildProcessJourneyPathD([], {
      clientWidth: 1000,
      scrollHeight: 700,
    } as HTMLElement);

    expect(d).toBe("M8 30 C 8 260, 940 260, 992 720");
  });
});
