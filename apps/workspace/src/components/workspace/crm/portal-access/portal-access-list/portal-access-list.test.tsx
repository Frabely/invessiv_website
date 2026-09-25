// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { getCrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { PortalAccessList } from "./portal-access-list";

afterEach(cleanup);

describe("PortalAccessList", () => {
  it("binds invitation and membership actions to the correct records", () => {
    const onReinvite = vi.fn();
    const onRevokeInvitation = vi.fn();
    const onEditRoles = vi.fn();
    const onRevokeMembership = vi.fn();
    const access: PortalAccessDto = {
      customerId: "customer",
      customerVersion: 1,
      previewConfirmedAt: null,
      contacts: [{ assignmentId: "contact", displayName: "Alex Kontakt" }],
      roles: [
        {
          id: "role",
          name: "Standard",
          systemKey: "portal_standard",
          active: true,
          permissions: [],
        },
      ],
      invitations: [
        {
          id: "invitation",
          assignmentId: "contact",
          roleIds: ["role"],
          expiresAt: "2026-10-01T00:00:00.000Z",
          expired: false,
          createdAt: "2026-09-25T00:00:00.000Z",
        },
      ],
      memberships: [
        {
          id: "membership",
          assignmentId: "contact",
          version: 1,
          roleIds: ["role"],
          activatedAt: "2026-09-25T00:00:00.000Z",
          lastSeenAt: null,
          emailNotificationsEnabled: true,
        },
      ],
    };

    render(
      <PortalAccessList
        access={access}
        content={getCrmPortalAccessDictionary("de")}
        permissionsContent={getSettingsPermissionsDictionary("de")}
        locale="de"
        busyId={null}
        onReinvite={onReinvite}
        onRevokeInvitation={onRevokeInvitation}
        onEditRoles={onEditRoles}
        onRevokeMembership={onRevokeMembership}
      />,
    );

    expect(screen.getAllByText("Portal-Standard")).toHaveLength(2);
    fireEvent.click(
      screen.getByRole("button", { name: "Neuen Link erstellen" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Einladung widerrufen" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Rollen ändern" }));
    fireEvent.click(screen.getByRole("button", { name: "Zugang widerrufen" }));
    expect(onReinvite).toHaveBeenCalledWith("contact");
    expect(onRevokeInvitation).toHaveBeenCalledWith("invitation");
    expect(onEditRoles).toHaveBeenCalledWith("membership");
    expect(onRevokeMembership).toHaveBeenCalledWith("membership");
  });
});
