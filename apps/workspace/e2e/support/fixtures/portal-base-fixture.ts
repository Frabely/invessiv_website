import { randomUUID } from "node:crypto";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { type ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
} from "@invessiv/db/record-configuration";
import { PORTAL_E2E_PREFIX as PREFIX } from "@/common/constants/testing/portal-e2e-prefix";
import type { PortalE2eSeed } from "@/common/contracts/testing/portal-e2e-seed";
export async function insertBase(
  tx: ContactDatabaseTransaction,
  seed: PortalE2eSeed,
) {
  const {
    managerMemberId,
    customerA,
    customerB,
    filesCustomer,
    credentialsCustomer,
    feedbackCustomer,
    personFeedback,
    personA,
    personB,
    personExpired,
    personFiles,
    assignmentA,
    assignmentB,
    assignmentOther,
    expiredAssignment,
  } = seed;
  await tx.insert(people).values([
    {
      id: personA,
      display_name: `${PREFIX} Contact A`,
      primary_email: "invessiv-portal-a+clerk_test@example.com",
      preferred_locale: "de",
      version: 1,
    },
    {
      id: personB,
      display_name: `${PREFIX} Contact B`,
      primary_email: "invessiv-portal-b+clerk_test@example.com",
      preferred_locale: "de",
      version: 1,
    },
    {
      id: personExpired,
      display_name: `${PREFIX} Expired Contact`,
      primary_email: "expired-portal+clerk_test@example.com",
      preferred_locale: "de",
      version: 1,
    },
    {
      id: personFiles,
      display_name: `${PREFIX} Files Contact`,
      primary_email: "invessiv-portal-files+clerk_test@example.com",
      preferred_locale: "de",
      version: 1,
    },
    {
      id: personFeedback,
      display_name: `${PREFIX} Feedback Contact`,
      primary_email: "invessiv-portal-feedback+clerk_test@example.com",
      preferred_locale: "de",
      version: 1,
    },
  ]);
  await tx.insert(customers).values([
    {
      id: credentialsCustomer,
      display_name: `${PREFIX} Credentials Customer`,
      status: CustomerStatus.Active,
      owner_member_id: managerMemberId,
      version: 1,
    },
    {
      id: customerA,
      display_name: `${PREFIX} Customer A`,
      status: CustomerStatus.Active,
      owner_member_id: managerMemberId,
      version: 1,
    },
    {
      id: customerB,
      display_name: `${PREFIX} Customer B`,
      status: CustomerStatus.Active,
      owner_member_id: managerMemberId,
      version: 1,
    },
    {
      id: filesCustomer,
      display_name: `${PREFIX} Files Customer`,
      status: CustomerStatus.Active,
      owner_member_id: managerMemberId,
      version: 1,
    },
    {
      id: feedbackCustomer,
      display_name: `${PREFIX} Feedback Customer`,
      status: CustomerStatus.Active,
      owner_member_id: managerMemberId,
      version: 1,
    },
  ]);
  await tx.insert(customerContactAssignments).values([
    {
      id: randomUUID(),
      customer_id: credentialsCustomer,
      person_id: personFiles,
      is_primary: true,
      version: 1,
    },
    {
      id: randomUUID(),
      customer_id: credentialsCustomer,
      person_id: personFeedback,
      is_primary: false,
      version: 1,
    },
    {
      id: assignmentA,
      customer_id: customerA,
      person_id: personA,
      is_primary: true,
      version: 1,
    },
    {
      id: assignmentB,
      customer_id: customerB,
      person_id: personA,
      is_primary: true,
      version: 1,
    },
    {
      id: assignmentOther,
      customer_id: customerA,
      person_id: personB,
      is_primary: false,
      version: 1,
    },
    {
      id: expiredAssignment,
      customer_id: customerB,
      person_id: personExpired,
      is_primary: false,
      version: 1,
    },
    {
      id: randomUUID(),
      customer_id: filesCustomer,
      person_id: personFiles,
      is_primary: true,
      version: 1,
    },
    {
      id: randomUUID(),
      customer_id: feedbackCustomer,
      person_id: personFiles,
      is_primary: true,
      version: 1,
    },
    {
      id: randomUUID(),
      customer_id: feedbackCustomer,
      person_id: personFeedback,
      is_primary: false,
      version: 1,
    },
  ]);
}
