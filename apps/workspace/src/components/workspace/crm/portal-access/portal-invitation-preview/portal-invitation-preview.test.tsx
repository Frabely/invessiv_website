// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getCrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { PortalInvitationPreview } from "./portal-invitation-preview";

afterEach(cleanup);

describe("PortalInvitationPreview", () => {
  it("names the visible areas and keeps the internal-data warning in the preview", () => {
    render(
      <PortalInvitationPreview
        content={getCrmPortalAccessDictionary("de")}
        contactName="Alex Kontakt"
        roles={[
          {
            id: "role",
            name: "Standard",
            systemKey: "portal_standard",
            active: true,
            permissions: [],
          },
        ]}
        permittedAreas={["Firmenbereich"]}
      />,
    );

    expect(screen.getByText("Sichtbare Portalbereiche")).toBeInTheDocument();
    expect(screen.getByText("Firmenbereich")).toBeInTheDocument();
    expect(screen.getByText("Alex Kontakt")).toBeInTheDocument();
    expect(
      screen.getByText(/Zugangsdaten bleiben immer intern/),
    ).toBeInTheDocument();
  });
});
