// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { getCrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { PortalInviteStepContent } from "./portal-invite-step-content";

const access: PortalAccessDto = {
  customerId: "customer-a",
  customerVersion: 1,
  previewConfirmedAt: null,
  contacts: [],
  roles: [
    {
      id: "role-a",
      name: "Standard",
      systemKey: "portal_standard",
      active: true,
      permissions: ["portal.access"],
    },
  ],
  invitations: [],
  memberships: [],
};

describe("PortalInviteStepContent", () => {
  it("shows selected contact, role and private-data warning in the preview", () => {
    render(
      <PortalInviteStepContent
        access={access}
        content={getCrmPortalAccessDictionary("de")}
        permissionsContent={getSettingsPermissionsDictionary("de")}
        baseId="portal-test"
        assignmentId="assignment-a"
        roleIds={["role-a"]}
        contactName="Alex Kontakt"
        permittedAreas={[]}
        preview
        inviteUrl={null}
        copied={false}
        onAssignmentChange={() => {}}
        onRoleToggle={() => {}}
        onCopy={() => {}}
      />,
    );
    expect(screen.getByText("Alex Kontakt")).toBeInTheDocument();
    expect(screen.getByText("Portal-Standard")).toBeInTheDocument();
    expect(screen.getByText(/Preise, Budgets/)).toBeInTheDocument();
  });
});
