import { randomUUID } from "node:crypto";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { type ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerHourPurchases,
  customers,
  projectHourAllocations,
  projects,
  projectTimeEntries,
  rolePermissions,
  roles,
} from "@invessiv/db/record-configuration";
import { PORTAL_E2E_PREFIX as PREFIX } from "@/test/constants/portal-e2e-prefix";
import { plainProjectRow } from "./portal-project-rows";
/**
 * The worked example of the hours plan on its own customer: 10:00 bought, 5:00 for each of two
 * projects, 2:30 and 6:00 booked, plus one goodwill entry that counts against nothing. A second
 * customer holds different numbers, and a custom role without the detail right exists for the
 * contact who may see the balance only.
 */
export async function insertHoursFixture(
  tx: ContactDatabaseTransaction,
  input: {
    hoursCustomer: string;
    hoursOtherCustomer: string;
    hoursProjectA: string;
    hoursProjectB: string;
    hoursOtherProject: string;
    managerMemberId: string;
  },
): Promise<string> {
  const { hoursCustomer, hoursOtherCustomer, managerMemberId } = input;
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10);

  await tx.insert(customers).values(
    [
      [hoursCustomer, "Hours Customer"],
      [hoursOtherCustomer, "Hours Other Customer"],
    ].map(([id, name]) => ({
      id,
      display_name: `${PREFIX} ${name}`,
      status: CustomerStatus.Active,
      owner_member_id: managerMemberId,
      version: 1,
    })),
  );
  await tx
    .insert(projects)
    .values([
      plainProjectRow(
        input.hoursProjectA,
        hoursCustomer,
        managerMemberId,
        "Hours Website",
      ),
      plainProjectRow(
        input.hoursProjectB,
        hoursCustomer,
        managerMemberId,
        "Hours Shop",
      ),
      plainProjectRow(
        input.hoursOtherProject,
        hoursOtherCustomer,
        managerMemberId,
        "Hours Other",
      ),
    ]);

  await tx.insert(customerHourPurchases).values(
    [
      [hoursCustomer, 600],
      [hoursOtherCustomer, 120],
    ].map(([customerId, minutes]) => ({
      id: randomUUID(),
      customer_id: customerId as string,
      kind: HourPurchaseKind.Purchase,
      source: HourPurchaseSource.Manual,
      minutes: minutes as number,
      purchased_on: yesterday,
      note: "Betreuung nach dem Launch",
      idempotency_key: randomUUID(),
      created_by_member_id: managerMemberId,
    })),
  );
  await tx.insert(projectHourAllocations).values(
    [input.hoursProjectA, input.hoursProjectB].map((projectId) => ({
      id: randomUUID(),
      customer_id: hoursCustomer,
      project_id: projectId,
      minutes: 300,
      note: "E2E internal allocation note",
      idempotency_key: randomUUID(),
      created_by_member_id: managerMemberId,
    })),
  );
  await tx.insert(projectTimeEntries).values(
    (
      [
        [hoursCustomer, input.hoursProjectA, 60, "Umbau Hero-Section", true],
        [hoursCustomer, input.hoursProjectA, 90, "Kontaktformular", true],
        [hoursCustomer, input.hoursProjectA, 30, "Kleine Textkorrektur", false],
        [hoursCustomer, input.hoursProjectB, 360, "Produktseiten", true],
        [
          hoursOtherCustomer,
          input.hoursOtherProject,
          15,
          "Fremde Buchung",
          true,
        ],
      ] as const
    ).map(([customerId, projectId, minutes, description, billable]) => ({
      id: randomUUID(),
      customer_id: customerId,
      project_id: projectId,
      task_id: null,
      performed_on: yesterday,
      duration_minutes: minutes,
      description,
      billable,
      performed_by_member_id: managerMemberId,
      version: 1,
    })),
  );

  const summaryRoleId = randomUUID();
  await tx.insert(roles).values({
    id: summaryRoleId,
    realm: AuthRealm.Portal,
    system_key: null,
    name: `${PREFIX} Hours summary only`,
    description: null,
    is_system: false,
    active: true,
    scope_assignable: false,
    version: 1,
  });
  await tx.insert(rolePermissions).values(
    [Permission.PortalAccess, Permission.PortalHoursRead].map((key) => ({
      role_id: summaryRoleId,
      realm: AuthRealm.Portal,
      role_is_system: false,
      role_scope_assignable: false,
      permission_key: key,
      permission_delegable: true,
      permission_scope_assignable: false,
    })),
  );
  return summaryRoleId;
}
