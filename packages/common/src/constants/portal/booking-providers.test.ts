import { describe, expect, it } from "vitest";

import {
  BOOKING_PROVIDER_NAMES,
  BOOKING_PROVIDER_VALUES,
  BOOKING_PROVIDERS,
  BookingProvider,
} from "./booking-providers";

describe("BookingProvider", () => {
  it("contains the exact values without duplicates", () => {
    expect(BOOKING_PROVIDER_VALUES).toEqual(["calendly", "cal_com", "other"]);
    expect([...BOOKING_PROVIDER_VALUES]).toEqual(
      Object.values(BookingProvider),
    );
    expect(new Set(BOOKING_PROVIDER_VALUES).size).toBe(
      BOOKING_PROVIDER_VALUES.length,
    );
  });

  it("maps the known domains and names every provider except the unnamed one", () => {
    expect(BOOKING_PROVIDERS).toEqual({
      "calendly.com": "calendly",
      "cal.com": "cal_com",
    });
    expect(BOOKING_PROVIDER_NAMES).toEqual({
      calendly: "Calendly",
      cal_com: "Cal.com",
    });
  });
});
