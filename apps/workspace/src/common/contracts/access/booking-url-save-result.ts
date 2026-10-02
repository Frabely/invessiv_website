import type { OwnBookingUrlDto } from "@invessiv/common/contracts/auth/own-booking-url.dto";

/**
 * What the booking link dialog learns from a save, whoever's link it edits. `current` carries the
 * stored state of a version conflict; `null` stands for every other failure.
 */
export type BookingUrlSaveResult =
  { ok: true } | { ok: false; current: OwnBookingUrlDto | null };
