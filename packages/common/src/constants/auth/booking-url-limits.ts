/**
 * Limits of a member's booking link. The schema, the settings forms and the CHECK on
 * `workspace_members.booking_url` read the same values.
 */
export const BookingUrlLimits = {
  MaxLength: 2048,
  Protocol: "https:",
} as const;
