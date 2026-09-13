import type { User } from "@clerk/nextjs/server";

import type { ClerkUserProfile } from "@/server/workspace/auth/clerk-user-profile-types";

type ClerkUserSource = Pick<
  User,
  "emailAddresses" | "firstName" | "id" | "lastName" | "primaryEmailAddressId"
>;

function mapUserToProfile(user: ClerkUserSource): ClerkUserProfile {
  const primaryEmail =
    user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)
      ?.emailAddress ?? null;
  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ");

  return {
    clerkUserId: user.id,
    primaryEmail,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    displayName: fullName || primaryEmail || user.id,
  };
}

export const clerkUserProfileMappingService = {
  mapUserToProfile,
} as const;
