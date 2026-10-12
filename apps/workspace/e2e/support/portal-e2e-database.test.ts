import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import {
  customerContactAssignments,
  customers,
  lineItemTemplates,
  people,
  portalInvitationRoles,
  portalInvitations,
  portalMembershipRoles,
  portalMemberships,
  projects,
  projectTimeEntries,
  roles,
  tasks,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { preparePortalE2eDatabase } from "./portal-e2e-database";

const mocks = vi.hoisted(() => ({ database: vi.fn() }));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: mocks.database,
}));
vi.mock("@vercel/blob", () => ({
  BlobNotFoundError: class extends Error {},
  del: vi.fn(),
}));

// The fixture is exercised against a recording transaction, never a real database or storage service.
type SeedRow = Record<string, unknown>;
function recordingTransaction() {
  const records = new Map<object, SeedRow[]>();
  let lastUser: SeedRow | undefined;
  const completed = {
    then: (resolve: () => unknown) => Promise.resolve().then(resolve),
  };
  const tx = {
    delete: () => ({ where: () => Promise.resolve() }),
    insert: (table: object) => ({
      values: (payload: SeedRow | readonly SeedRow[]) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        const stored = records.get(table) ?? [];
        for (const row of rows) {
          if (table === users) {
            const existing = stored.find(
              (value) => value.clerk_user_id === row.clerk_user_id,
            );
            lastUser = existing ?? row;
            if (existing) continue;
          }
          stored.push(row);
        }
        records.set(table, stored);
        return { ...completed, onConflictDoNothing: () => Promise.resolve() };
      },
    }),
    select: () => ({
      from: (table: object) => ({
        where: () => {
          const selected =
            table === roles
              ? [
                  SystemRoleKey.WorkspaceOwner,
                  SystemRoleKey.PortalStandard,
                  SystemRoleKey.PortalCredentials,
                ].map((key) => ({ id: key, key, active: true }))
              : table === users
                ? [lastUser!]
                : table === workspaceMembers
                  ? (records.get(table) ?? [])
                  : [];
          return {
            then: (resolve: (rows: SeedRow[]) => unknown) =>
              Promise.resolve(selected).then(resolve),
            limit: () => Promise.resolve(selected),
          };
        },
      }),
    }),
  };
  return { tx, rows: (table: object) => records.get(table) ?? [] };
}

describe("portal E2E fixture composition", () => {
  beforeEach(() => mocks.database.mockReset());

  it("preserves the fixture graph and company-specific memberships across domain modules", async () => {
    const recorder = recordingTransaction();
    mocks.database.mockReturnValue({
      transaction: (run: (tx: object) => unknown) => run(recorder.tx),
    });
    const fixture = await preparePortalE2eDatabase(
      "manager",
      "files-contact",
      "feedback-contact",
    );
    expect(recorder.rows(users)).toHaveLength(3);
    expect(recorder.rows(people)).toHaveLength(5);
    expect(recorder.rows(customers)).toHaveLength(7);
    expect(recorder.rows(projects)).toHaveLength(10);
    expect(recorder.rows(tasks)).toHaveLength(2);
    expect(recorder.rows(customerContactAssignments)).toHaveLength(12);
    expect(recorder.rows(portalMemberships)).toHaveLength(8);
    expect(recorder.rows(portalMembershipRoles)).toHaveLength(9);
    expect(recorder.rows(projectTimeEntries)).toHaveLength(5);

    const hidden = recorder
      .rows(projects)
      .find((row) => row.id === fixture.credentialsHiddenProject);
    expect(hidden).toMatchObject({
      customer_id: fixture.credentialsCustomer,
      status: ProjectStatus.Archived,
    });
    const credentials = recorder
      .rows(portalMembershipRoles)
      .filter(
        (row) => row.portal_membership_id === fixture.credentialsMembership,
      );
    expect(credentials.map((row) => row.role_id)).toEqual([
      fixture.standardRole,
      fixture.credentialsRole,
    ]);
    const members = recorder
      .rows(portalMemberships)
      .filter((row) => row.customer_id === fixture.hoursCustomer);
    const assignedRoles = members.map(
      (member) =>
        recorder
          .rows(portalMembershipRoles)
          .find((row) => row.portal_membership_id === member.id)?.role_id,
    );
    expect(assignedRoles).toContain(fixture.standardRole);
    expect(
      assignedRoles.filter((role) => role !== fixture.standardRole),
    ).toHaveLength(1);

    expect(recorder.rows(lineItemTemplates)).toHaveLength(4);
    expect(
      recorder
        .rows(lineItemTemplates)
        .find((row) => row.id === fixture.serviceHours),
    ).toMatchObject({ kind: LineItemKind.Hours, portal_requestable: true });
    const invitation = recorder.rows(portalInvitations)[0];
    expect(invitation).toMatchObject({
      assignment_id: recorder
        .rows(customerContactAssignments)
        .find(
          (row) =>
            row.person_id ===
            recorder
              .rows(people)
              .find(
                (person) =>
                  person.display_name === "Invessiv Portal E2E Expired Contact",
              )?.id,
        )?.id,
    });
    expect(invitation.token_hash).not.toBe(fixture.expiredToken);
    expect(recorder.rows(portalInvitationRoles)[0]).toMatchObject({
      portal_invitation_id: invitation.id,
      role_id: fixture.standardRole,
    });
  });
});
