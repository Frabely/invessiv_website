import type { VersionedDto } from "@invessiv/common/contracts/concurrency/versioned";

/**
 * What a member reads and writes about the own membership without `members.manage`: the booking
 * link and the version the next write has to send back. Nothing else of the member leaves here.
 */
export interface OwnBookingUrlDto extends VersionedDto {
  /** The member's own booking link; null when none is set. */
  bookingUrl: string | null;
}
