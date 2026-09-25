// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { PortalMembershipRolesDialog } from "./portal-membership-roles-dialog";

const mocks = vi.hoisted(() => ({ replaceRoles: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/portal-access-api-service", () => ({
  portalAccessApiService: { replaceRoles: mocks.replaceRoles },
}));
vi.mock("@invessiv/ui", () => ({
  DialogSize: { Narrow: "narrow" },
  Dialog: ({
    title,
    children,
    footer,
  }: {
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
  }) => (
    <section aria-label={title}>
      {children}
      {footer}
    </section>
  ),
  ButtonControl: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  CheckboxControl: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} type="checkbox" />
  ),
}));
afterEach(cleanup);

describe("PortalMembershipRolesDialog", () => {
  it("keeps the membership unchanged when the last role is unchecked", () => {
    render(
      <PortalMembershipRolesDialog
        membership={{
          id: "membership",
          assignmentId: "assignment",
          version: 3,
          roleIds: ["role"],
          activatedAt: "2026-01-01T00:00:00.000Z",
          lastSeenAt: null,
          emailNotificationsEnabled: true,
        }}
        roles={[
          {
            id: "role",
            name: "Standard",
            systemKey: "portal_standard",
            active: true,
            permissions: ["portal.access"],
          },
        ]}
        content={getCrmPortalAccessDictionary("de")}
        onCloseAction={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Portal-Standard" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Änderungen speichern" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Wähle mindestens eine",
    );
    expect(mocks.replaceRoles).not.toHaveBeenCalled();
  });
});
