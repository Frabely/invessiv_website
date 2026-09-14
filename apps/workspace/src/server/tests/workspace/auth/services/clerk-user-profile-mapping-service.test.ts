import { describe, expect, it } from "vitest";

import { clerkUserProfileMappingService } from "@/server/workspace/auth/services/clerk-user-profile-mapping-service";

type ClerkUserInput = Parameters<
  typeof clerkUserProfileMappingService.mapUserToProfile
>[0];

function clerkUser(overrides: Partial<ClerkUserInput>): ClerkUserInput {
  return {
    id: "user_123",
    firstName: "Moritz",
    lastName: "Hecht",
    primaryEmailAddressId: "email_primary",
    emailAddresses: [
      { id: "email_other", emailAddress: "other@example.test" },
      { id: "email_primary", emailAddress: "primary@example.test" },
    ] as ClerkUserInput["emailAddresses"],
    ...overrides,
  };
}

describe("clerkUserProfileMappingService.mapUserToProfile", () => {
  it("maps the primary address and the full name", () => {
    expect(
      clerkUserProfileMappingService.mapUserToProfile(clerkUser({})),
    ).toEqual({
      clerkUserId: "user_123",
      primaryEmail: "primary@example.test",
      firstName: "Moritz",
      lastName: "Hecht",
      displayName: "Moritz Hecht",
    });
  });

  it("falls back to the primary email when no name is set", () => {
    const profile = clerkUserProfileMappingService.mapUserToProfile(
      clerkUser({ firstName: null, lastName: "  " }),
    );

    expect(profile.displayName).toBe("primary@example.test");
    expect(profile.firstName).toBeNull();
  });

  it("returns a null email and the clerk id as name for an account without both", () => {
    const profile = clerkUserProfileMappingService.mapUserToProfile(
      clerkUser({
        firstName: null,
        lastName: null,
        primaryEmailAddressId: null,
        emailAddresses: [],
      }),
    );

    expect(profile.primaryEmail).toBeNull();
    expect(profile.displayName).toBe("user_123");
  });
});
