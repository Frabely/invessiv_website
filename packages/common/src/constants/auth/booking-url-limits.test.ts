import { describe, expect, it } from "vitest";

import { BookingUrlLimits } from "./booking-url-limits";

describe("BookingUrlLimits", () => {
  it("contains the exact limits", () => {
    expect(BookingUrlLimits).toEqual({ MaxLength: 2048, Protocol: "https:" });
  });
});
