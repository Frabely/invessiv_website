import { randomUUID } from "node:crypto";
import { type ContactDatabaseTransaction } from "@invessiv/db/core";
import { customerContactAssignments } from "@invessiv/db/record-configuration";
import type { PortalE2eSeed } from "@/test/contracts/portal-e2e-seed";
import { insertHoursFixture } from "./portal-hours-fixture";
import { insertPortalMember } from "./portal-auth-fixture";
export async function insertHoursAccessFixture(
  tx: ContactDatabaseTransaction,
  seed: PortalE2eSeed,
  filesContactClerkUserId: string,
  feedbackContactClerkUserId: string,
  portalId: string,
) {
  const {
    managerMemberId,
    hoursCustomer,
    hoursOtherCustomer,
    hoursProjectA,
    hoursProjectB,
    personFeedback,
    personFiles,
  } = seed;
  const hoursSummaryRole = await insertHoursFixture(tx, {
    hoursCustomer,
    hoursOtherCustomer,
    hoursProjectA,
    hoursProjectB,
    hoursOtherProject: randomUUID(),
    managerMemberId,
  });
  await tx.insert(customerContactAssignments).values([
    {
      id: randomUUID(),
      customer_id: hoursCustomer,
      person_id: personFiles,
      is_primary: true,
      version: 1,
    },
    {
      id: randomUUID(),
      customer_id: hoursCustomer,
      person_id: personFeedback,
      is_primary: false,
      version: 1,
    },
    {
      id: randomUUID(),
      customer_id: hoursOtherCustomer,
      person_id: personFeedback,
      is_primary: true,
      version: 1,
    },
  ]);
  await insertPortalMember(tx, {
    clerkUserId: filesContactClerkUserId,
    email: "invessiv-portal-files+clerk_test@example.com",
    lastName: "Files Contact",
    customerId: hoursCustomer,
    personId: personFiles,
    portalRoleId: portalId,
    managerMemberId,
  });
  // Same person, two companies: the summary-only role here, the standard role at the other one.
  await insertPortalMember(tx, {
    clerkUserId: feedbackContactClerkUserId,
    email: "invessiv-portal-feedback+clerk_test@example.com",
    lastName: "Feedback Contact",
    customerId: hoursCustomer,
    personId: personFeedback,
    portalRoleId: hoursSummaryRole,
    managerMemberId,
  });
  await insertPortalMember(tx, {
    clerkUserId: feedbackContactClerkUserId,
    email: "invessiv-portal-feedback+clerk_test@example.com",
    lastName: "Feedback Contact",
    customerId: hoursOtherCustomer,
    personId: personFeedback,
    portalRoleId: portalId,
    managerMemberId,
  });
}
