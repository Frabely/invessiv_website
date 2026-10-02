import { BookingUrlLimits } from "@invessiv/common/constants/auth/booking-url-limits";

/** Input limits shared by the access schemas on the server and the settings forms in the client. */
export const AccessFieldLimits = {
  RoleNameMaxLength: 80,
  RoleDescriptionMaxLength: 280,
  ClerkUserIdMaxLength: 191,
  ClerkCandidateQueryMaxLength: 100,
  AssignedRoleIdsMax: 50,
  AccessLookupQueryMaxLength: 100,
  AccessLookupResultLimit: 25,
  AccessScopeAssignmentsMax: 500,
  BookingUrlMaxLength: BookingUrlLimits.MaxLength,
} as const;
