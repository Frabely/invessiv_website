import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { type ContactDatabaseTransaction } from "@invessiv/db/core";
import { portalMembershipRoles } from "@invessiv/db/record-configuration";
import type { PortalE2eSeed } from "@/common/contracts/testing/portal-e2e-seed";
import { insertPortalMember } from "./portal-auth-fixture";
export async function insertCredentialsFixture(
  tx: ContactDatabaseTransaction,
  seed: PortalE2eSeed,
  filesContactClerkUserId: string,
  feedbackContactClerkUserId: string,
  portalId: string,
  credentialsId: string,
) {
  const { managerMemberId, credentialsCustomer, personFeedback, personFiles } =
    seed;
  const credentialsMembership = await insertPortalMember(tx, {
    clerkUserId: filesContactClerkUserId,
    email: "invessiv-portal-files+clerk_test@example.com",
    lastName: "Files Contact",
    customerId: credentialsCustomer,
    personId: personFiles,
    portalRoleId: portalId,
    managerMemberId,
  });
  await tx.insert(portalMembershipRoles).values({
    portal_membership_id: credentialsMembership,
    role_id: credentialsId,
    role_realm: AuthRealm.Portal,
    assigned_by_member_id: managerMemberId,
    assigned_at: new Date(),
  });
  await insertPortalMember(tx, {
    clerkUserId: feedbackContactClerkUserId,
    email: "invessiv-portal-feedback+clerk_test@example.com",
    lastName: "Feedback Contact",
    customerId: credentialsCustomer,
    personId: personFeedback,
    portalRoleId: portalId,
    managerMemberId,
  });
  return credentialsMembership;
}
