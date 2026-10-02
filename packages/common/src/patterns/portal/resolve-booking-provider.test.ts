import { describe, expect, it } from "vitest";

import { BookingProvider } from "../../constants/portal/booking-providers";
import { resolveBookingProvider } from "./resolve-booking-provider";

describe("resolveBookingProvider", () => {
  it.each([
    ["https://calendly.com/anna/onboarding", BookingProvider.Calendly],
    ["https://CALENDLY.com/anna", BookingProvider.Calendly],
    ["https://app.calendly.com/anna", BookingProvider.Calendly],
    ["https://calendly.com./anna", BookingProvider.Calendly],
    ["https://cal.com/anna/30min", BookingProvider.CalCom],
    ["https://app.cal.com/anna", BookingProvider.CalCom],
  ])("recognizes %s", (url, provider) => {
    expect(resolveBookingProvider(url)).toBe(provider);
  });

  it.each([
    ["https://termine.example.org/anna"],
    ["https://notcalendly.com/anna"],
    ["https://calendly.com.example.org/anna"],
    ["https://example.org/calendly.com"],
    ["https://local.com/anna"],
    ["not a url"],
  ])("treats %s as an unnamed external provider", (url) => {
    expect(resolveBookingProvider(url)).toBe(BookingProvider.Other);
  });
});
