import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";

/**
 * Body of `PATCH /api/workspace/members/[id]/booking-url` and of
 * `PATCH /api/workspace/members/me/booking-url`.
 */
export interface UpdateMemberBookingUrlRequestDto extends VersionedWriteInput {
  /** The `https` link to store; null or an empty string clears it. */
  bookingUrl: string | null;
}
