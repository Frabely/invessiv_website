// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { getCrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { PortalAccessSection } from "./portal-access-section";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../invite-portal-contact-dialog/invite-portal-contact-dialog", () => ({
  PortalInviteDialog: () => null,
}));
vi.mock(
  "../portal-membership-roles-dialog/portal-membership-roles-dialog",
  () => ({ PortalMembershipRolesDialog: () => null }),
);

afterEach(cleanup);
const emptyAccess: PortalAccessDto = {
  customerId: "customer-a",
  customerVersion: 1,
  previewConfirmedAt: null,
  contacts: [],
  roles: [],
  invitations: [],
  memberships: [],
};

describe("PortalAccessSection", () => {
  it("explains the purpose of portal access before any contact is invited", () => {
    render(
      <PortalAccessSection
        access={emptyAccess}
        content={getCrmPortalAccessDictionary("de")}
        locale="de"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Portalzugang" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Lade einen bestehenden Kontakt ein/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kontakt einladen" }),
    ).toBeInTheDocument();
  });

  it("does not expose the digest-email setting before mail delivery is available", () => {
    render(
      <PortalAccessSection
        access={{
          ...emptyAccess,
          contacts: [
            { assignmentId: "assignment-a", displayName: "Alex Contact" },
          ],
          memberships: [
            {
              id: "membership-a",
              assignmentId: "assignment-a",
              version: 1,
              roleIds: [],
              activatedAt: "2026-09-24T12:00:00.000Z",
              lastSeenAt: null,
              emailNotificationsEnabled: true,
            },
          ],
        }}
        content={getCrmPortalAccessDictionary("de")}
        locale="de"
      />,
    );

    expect(screen.getByText("Alex Contact")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rollen ändern" }),
    ).toBeInTheDocument();
  });

  it("shows an expired invitation as expired rather than pending", () => {
    render(
      <PortalAccessSection
        access={{
          ...emptyAccess,
          contacts: [
            { assignmentId: "assignment-a", displayName: "Alex Contact" },
          ],
          invitations: [
            {
              id: "invitation-a",
              assignmentId: "assignment-a",
              roleIds: [],
              expiresAt: "2026-01-08T00:00:00.000Z",
              expired: true,
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        }}
        content={getCrmPortalAccessDictionary("de")}
        locale="de"
      />,
    );

    expect(screen.getByText("Einladung abgelaufen")).toBeInTheDocument();
    expect(screen.queryByText(/Einladung offen/)).not.toBeInTheDocument();
  });
});
